<?php

namespace Tests\Feature\Inventory;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Services\InventoryClassificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pricing and classification tests for Phase 2.
 *
 * Covered cases:
 *   A. unit_cost >= 50 000 → PPE
 *   B. unit_cost > 0 and < 50 000 → SE
 *   C. unit_cost omitted (no key in payload) → existing classification unchanged
 *   D. unit_cost explicitly null → classification = NULL (manual review)
 *   E. unit_cost = 0 → classification = NULL (manual review)
 *   F. unit_cost < 0 → rejected (422)
 *   G. SE → PPE recalculation on price update
 *   H. PPE → SE recalculation on price update
 *   I. Changing price to null/0 clears PPE/SE to NULL (manual review)
 *   J. Supply remains SUPPLY with null, zero, and positive unit_cost
 *   K. Supply does not enter PPE/SE classification logic
 *   L. Legacy records without unit_cost are preserved
 *   M. Accountable item linked to asset cannot be changed to SUPPLY
 *   N. CRUD regression
 *   O. Service unit tests (threshold boundaries, negative rejection)
 */
class InventoryClassificationPricingTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user  = User::factory()->create();
        $this->token = $this->user->createToken('auth')->plainTextToken;
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private function createItem(array $overrides = []): array
    {
        return $this->withToken($this->token)
            ->postJson('/api/v1/inventory', array_merge([
                'name'           => 'Test Item',
                'sku'            => 'SKU-' . uniqid(),
                'quantity'       => 1,
                'unit'           => 'unit',
                'classification' => 'PPE',
                'item_nature'    => 'ACCOUNTABLE_PROPERTY',
                'track_as_asset' => false,
            ], $overrides))
            ->assertCreated()
            ->decodeResponseJson()['data'];
    }

    private function updateItem(array $item, array $overrides = []): array
    {
        return $this->withToken($this->token)
            ->putJson("/api/v1/inventory/{$item['id']}", array_merge([
                'name'           => $item['name'],
                'sku'            => $item['sku'],
                'quantity'       => $item['quantity'],
                'unit'           => $item['unit'],
                'classification' => $item['classification'],
                'item_nature'    => $item['item_nature'] ?? 'ACCOUNTABLE_PROPERTY',
            ], $overrides))
            ->assertOk()
            ->decodeResponseJson()['data'];
    }

    // ── A: PPE at threshold ────────────────────────────────────────────────

    public function test_unit_cost_at_or_above_50000_results_in_PPE(): void
    {
        $item = $this->createItem(['unit_cost' => 50000.00]);
        $this->assertSame('PPE', $item['classification'], 'Exactly 50 000 must be PPE.');
        $this->assertStringContainsString('PPE', $item['classification_reason']);

        $item2 = $this->createItem(['unit_cost' => 75000.00, 'sku' => 'PPE2-' . uniqid()]);
        $this->assertSame('PPE', $item2['classification']);

        $item3 = $this->createItem(['unit_cost' => 250000.00, 'sku' => 'PPE3-' . uniqid()]);
        $this->assertSame('PPE', $item3['classification']);
    }

    // ── B: SE below threshold ──────────────────────────────────────────────

    public function test_unit_cost_above_zero_and_below_50000_results_in_SE(): void
    {
        $item = $this->createItem(['unit_cost' => 49999.99]);
        $this->assertSame('SE', $item['classification'], '49 999.99 must be SE.');
        $this->assertStringContainsString('SE', $item['classification_reason']);

        $item2 = $this->createItem(['unit_cost' => 15000.00, 'sku' => 'SE2-' . uniqid()]);
        $this->assertSame('SE', $item2['classification']);

        $item3 = $this->createItem(['unit_cost' => 0.01, 'sku' => 'SE3-' . uniqid()]);
        $this->assertSame('SE', $item3['classification']);
    }

    // ── C: unit_cost omitted → keep existing classification ───────────────

    public function test_omitting_unit_cost_preserves_existing_classification(): void
    {
        // unit_cost key absent → price block skipped → explicit PPE is honoured
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name'           => 'No-Cost PPE Item',
                'sku'            => 'NOCOST-' . uniqid(),
                'quantity'       => 1,
                'unit'           => 'unit',
                'classification' => 'PPE',
                'item_nature'    => 'ACCOUNTABLE_PROPERTY',
                'track_as_asset' => false,
                // unit_cost key intentionally absent
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $this->assertSame('PPE', $item['classification']);
        $this->assertNull($item['unit_cost']);
    }

    // ── D: explicit null unit_cost → classification = NULL ────────────────

    public function test_explicit_null_unit_cost_clears_classification_to_null(): void
    {
        // First create a PPE item with a valid price
        $item = $this->createItem(['unit_cost' => 60000.00]);
        $this->assertSame('PPE', $item['classification']);

        // Now update with explicit unit_cost: null
        $updated = $this->updateItem($item, ['unit_cost' => null]);

        $this->assertNull($updated['classification'],
            'Explicit null unit_cost must set classification to NULL (manual review).');
        $this->assertStringContainsString('Manual Review',
            (string) $updated['classification_reason']);
        $this->assertNull($updated['unit_cost']);

        $this->assertDatabaseHas('inventory_items', [
            'id'             => $item['id'],
            'classification' => null,
        ]);
    }

    // ── E: zero unit_cost → classification = NULL ─────────────────────────

    public function test_zero_unit_cost_clears_classification_to_null(): void
    {
        // Create SE item
        $item = $this->createItem(['unit_cost' => 10000.00]);
        $this->assertSame('SE', $item['classification']);

        // Update with zero
        $updated = $this->updateItem($item, ['unit_cost' => 0]);

        $this->assertNull($updated['classification'],
            'Zero unit_cost must set classification to NULL (manual review).');
        $this->assertStringContainsString('Manual Review',
            (string) $updated['classification_reason']);

        $this->assertDatabaseHas('inventory_items', [
            'id'             => $item['id'],
            'classification' => null,
        ]);
    }

    // ── F: negative price rejected ─────────────────────────────────────────

    public function test_negative_price_is_rejected_with_422(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name'      => 'Negative Cost Item',
                'sku'       => 'NEG-' . uniqid(),
                'quantity'  => 1,
                'unit'      => 'unit',
                'unit_cost' => -100.00,
            ])
            ->assertStatus(422);
    }

    // ── G: SE → PPE recalculation ─────────────────────────────────────────

    public function test_price_change_from_SE_to_PPE_recalculates_classification(): void
    {
        $item = $this->createItem(['unit_cost' => 10000.00]);
        $this->assertSame('SE', $item['classification']);

        $updated = $this->updateItem($item, ['unit_cost' => 55000.00]);

        $this->assertSame('PPE', $updated['classification']);
        $this->assertEqualsWithDelta(55000.00, $updated['unit_cost'], 0.01);
        $this->assertStringContainsString('PPE', $updated['classification_reason']);
        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'], 'classification' => 'PPE',
        ]);
    }

    // ── H: PPE → SE recalculation ─────────────────────────────────────────

    public function test_price_change_from_PPE_to_SE_recalculates_classification(): void
    {
        $item = $this->createItem(['unit_cost' => 75000.00]);
        $this->assertSame('PPE', $item['classification']);

        $updated = $this->updateItem($item, ['unit_cost' => 30000.00]);

        $this->assertSame('SE', $updated['classification']);
        $this->assertEqualsWithDelta(30000.00, $updated['unit_cost'], 0.01);
        $this->assertStringContainsString('SE', $updated['classification_reason']);
        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'], 'classification' => 'SE',
        ]);
    }

    // ── I: changing price to null/0 clears classification ─────────────────

    public function test_changing_price_to_null_after_PPE_clears_to_null(): void
    {
        $item = $this->createItem(['unit_cost' => 80000.00]);
        $this->assertSame('PPE', $item['classification']);

        $updated = $this->updateItem($item, ['unit_cost' => null]);
        $this->assertNull($updated['classification']);
        $this->assertStringContainsString('Manual Review', (string) $updated['classification_reason']);
    }

    public function test_changing_price_to_zero_after_SE_clears_to_null(): void
    {
        $item = $this->createItem(['unit_cost' => 20000.00]);
        $this->assertSame('SE', $item['classification']);

        $updated = $this->updateItem($item, ['unit_cost' => 0]);
        $this->assertNull($updated['classification']);
        $this->assertStringContainsString('Manual Review', (string) $updated['classification_reason']);
    }

    // ── J: Supply with null, zero, and positive unit_cost ─────────────────

    public function test_supply_remains_SUPPLY_with_null_unit_cost(): void
    {
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name'           => 'Supply Null Cost',
                'sku'            => 'SUP-NULL-' . uniqid(),
                'quantity'       => 10,
                'unit'           => 'ream',
                'classification' => 'SUPPLY',
                'item_nature'    => 'CONSUMABLE_SUPPLY',
                // unit_cost absent
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $this->assertSame('SUPPLY', $item['classification']);
    }

    public function test_supply_remains_SUPPLY_with_zero_unit_cost(): void
    {
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name'           => 'Supply Zero Cost',
                'sku'            => 'SUP-ZERO-' . uniqid(),
                'quantity'       => 10,
                'unit'           => 'ream',
                'classification' => 'SUPPLY',
                'item_nature'    => 'CONSUMABLE_SUPPLY',
                'unit_cost'      => 0,
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $this->assertSame('SUPPLY', $item['classification']);
    }

    public function test_supply_remains_SUPPLY_with_positive_unit_cost_above_threshold(): void
    {
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name'           => 'Bond Paper',
                'sku'            => 'SUP-POS-' . uniqid(),
                'quantity'       => 100,
                'unit'           => 'ream',
                'classification' => 'SUPPLY',
                'item_nature'    => 'CONSUMABLE_SUPPLY',
                'unit_cost'      => 75000.00,   // above PPE threshold — must NOT trigger PPE
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $this->assertSame('SUPPLY', $item['classification'],
            'Supply must not be reclassified as PPE even above the threshold.');
    }

    // ── K: Supply does not enter PPE/SE classification logic ──────────────

    public function test_supply_does_not_enter_PPE_SE_classification_logic(): void
    {
        $this->assertFalse(InventoryClassificationService::shouldClassifyByPrice('SUPPLY'));
        $this->assertTrue(InventoryClassificationService::shouldClassifyByPrice('PPE'));
        $this->assertTrue(InventoryClassificationService::shouldClassifyByPrice('SE'));
        $this->assertTrue(InventoryClassificationService::shouldClassifyByPrice(null));
    }

    // ── L: Legacy records preserved ───────────────────────────────────────

    public function test_legacy_records_without_unit_cost_are_preserved(): void
    {
        $ppe = InventoryItem::query()->create([
            'name' => 'Legacy PPE', 'sku' => 'LEG-PPE', 'quantity' => 1,
            'unit' => 'unit', 'type' => 'non_expendable',
            'classification' => 'PPE', 'item_nature' => 'ACCOUNTABLE_PROPERTY',
        ]);
        $supply = InventoryItem::query()->create([
            'name' => 'Legacy Supply', 'sku' => 'LEG-SUP', 'quantity' => 50,
            'unit' => 'ream', 'type' => 'expendable',
            'classification' => 'SUPPLY', 'item_nature' => 'CONSUMABLE_SUPPLY',
        ]);

        $this->assertSame('PPE',    $ppe->fresh()->classification);
        $this->assertNull($ppe->fresh()->unit_cost);
        $this->assertSame('SUPPLY', $supply->fresh()->classification);

        $response = $this->withToken($this->token)->getJson('/api/v1/inventory');
        $response->assertOk();
        $names = array_column($response->json('data.items'), 'name');
        $this->assertContains('Legacy PPE', $names);
        $this->assertContains('Legacy Supply', $names);
    }

    // ── M: Accountable item linked to asset cannot become SUPPLY ──────────

    public function test_accountable_item_linked_to_asset_cannot_be_changed_to_supply(): void
    {
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Linked Projector', 'sku' => 'LINK-' . uniqid(),
                'quantity' => 1, 'unit' => 'unit',
                'classification' => 'PPE', 'item_nature' => 'ACCOUNTABLE_PROPERTY',
                'track_as_asset' => true,
            ])
            ->assertCreated()->decodeResponseJson()['data'];

        $this->assertNotNull($item['asset_id']);

        $this->withToken($this->token)
            ->putJson("/api/v1/inventory/{$item['id']}", [
                'name' => $item['name'], 'sku' => $item['sku'],
                'quantity' => $item['quantity'], 'unit' => $item['unit'],
                'classification' => 'SUPPLY', 'item_nature' => 'CONSUMABLE_SUPPLY',
                'track_as_asset' => false,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'Supply'));
    }

    // ── N: CRUD regression ────────────────────────────────────────────────

    public function test_existing_inventory_crud_workflows_continue_passing(): void
    {
        $item = $this->withToken($this->token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Regression Item', 'sku' => 'REG-' . uniqid(),
                'quantity' => 10, 'unit' => 'piece',
            ])
            ->assertCreated()->decodeResponseJson()['data'];

        $this->withToken($this->token)
            ->postJson("/api/v1/inventory/{$item['id']}/stock-in", ['quantity' => 5])
            ->assertOk()->assertJsonPath('data.quantity', 15);

        $this->withToken($this->token)
            ->postJson("/api/v1/inventory/{$item['id']}/stock-out", ['quantity' => 3])
            ->assertOk()->assertJsonPath('data.quantity', 12);

        $this->withToken($this->token)
            ->postJson("/api/v1/inventory/{$item['id']}/adjust", [
                'quantity' => 10, 'reason' => 'Physical count correction',
            ])
            ->assertOk()->assertJsonPath('data.quantity', 10);

        $this->withToken($this->token)
            ->putJson("/api/v1/inventory/{$item['id']}", [
                'name' => 'Regression Item Updated', 'sku' => $item['sku'],
                'quantity' => $item['quantity'], 'unit' => $item['unit'],
            ])
            ->assertOk()->assertJsonPath('data.name', 'Regression Item Updated');

        $this->withToken($this->token)
            ->deleteJson("/api/v1/inventory/{$item['id']}")
            ->assertOk();

        $this->assertSoftDeleted('inventory_items', ['id' => $item['id']]);
    }

    // ── O: Service unit tests ──────────────────────────────────────────────

    public function test_classification_service_exact_threshold_boundaries(): void
    {
        $this->assertSame('PPE', InventoryClassificationService::classify(50000.00)['classification']);
        $this->assertSame('SE',  InventoryClassificationService::classify(49999.99)['classification']);
        $this->assertSame('SE',  InventoryClassificationService::classify(0.01)['classification']);
        $this->assertNull(InventoryClassificationService::classify(0)['classification']);
        $this->assertNull(InventoryClassificationService::classify(null)['classification']);
    }

    public function test_classification_service_rejects_negative_cost(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('cannot be negative');
        InventoryClassificationService::castAndValidate(-0.01);
    }
}
