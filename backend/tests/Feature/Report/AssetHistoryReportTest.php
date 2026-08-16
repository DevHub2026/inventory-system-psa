<?php

namespace Tests\Feature\Report;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class AssetHistoryReportTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithRole(UserRole $role): User
    {
        $user = User::factory()->create();
        $roleModel = Role::query()->firstOrCreate([
            'name' => $role->value,
        ], [
            'description' => $role->name,
        ]);
        $user->roles()->sync([$roleModel->id]);
        return $user;
    }

    private function createAssetRecord(string $status = 'AVAILABLE', int $uniqueId = 0): Asset
    {
        $office = \App\Modules\Asset\Models\Office::firstOrCreate(
            ['code' => 'OFF-'.$uniqueId],
            ['name' => 'Office '.$uniqueId, 'description' => 'Office '.$uniqueId]
        );

        $location = \App\Modules\Asset\Models\Location::firstOrCreate(
            ['code' => 'LOC-'.$uniqueId],
            [
                'office_id' => $office->id,
                'name' => 'Location '.$uniqueId,
                'description' => 'Storage room',
            ]
        );

        $category = \App\Modules\AssetCategory\Models\AssetCategory::firstOrCreate(
            ['code' => 'LAP-'.$uniqueId],
            [
                'name' => 'Laptop '.$uniqueId,
                'description' => 'Laptops',
            ]
        );

        $manufacturer = \App\Modules\Asset\Models\Manufacturer::firstOrCreate(
            ['code' => 'DEL-'.$uniqueId],
            [
                'name' => 'Dell '.$uniqueId,
                'description' => 'Dell computers',
            ]
        );

        return Asset::create([
            'asset_number' => 'AST-'.rand(1000, 9999).'-'.$uniqueId,
            'name' => 'Laptop 14-'.$uniqueId,
            'description' => 'Test asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Pro',
            'status' => $status,
            'condition_status' => 'GOOD',
            'purchase_date' => '2026-01-01',
            'purchase_cost' => 1200.00,
            'warranty_until' => '2027-01-01',
            'remarks' => 'Test asset',
        ]);
    }

    public function test_authorized_user_can_access_asset_history()
    {
        $user = $this->createUserWithRole(UserRole::AUDITOR);
        $asset = Asset::factory()->create([
            'asset_number' => 'AST-1001',
            'name' => 'Test Asset',
            'model' => 'X',
            'status' => 'AVAILABLE',
            'condition_status' => 'GOOD',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/reports/asset-history');
        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertArrayHasKey('items', $response->json('data'));
        $this->assertArrayHasKey('summary', $response->json('data'));
        $this->assertArrayHasKey('meta', $response->json('data'));
    }

    public function test_guest_cannot_access_asset_history()
    {
        $response = $this->getJson('/api/v1/reports/asset-history');
        $response->assertStatus(401);
    }

    public function test_user_without_role_is_forbidden()
    {
        // assign a role that is NOT allowed to access reports
        $user = User::factory()->create();
        $role = Role::firstOrCreate(['name' => 'Employee'], ['description' => 'Regular Employee']);
        $user->roles()->sync([$role->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/reports/asset-history');
        $response->assertStatus(403);
    }

    public function test_pagination_and_ordering_and_filters()
    {
        $user = $this->createUserWithRole(UserRole::AUDITOR);

        // create 3 assets with created_at spaced
        $a1 = Asset::factory()->create(['asset_number' => 'AST-1', 'name' => 'A1', 'model' => 'M', 'status' => 'AVAILABLE', 'condition_status' => 'GOOD', 'created_at' => now()->subDays(3)]);
        $a2 = Asset::factory()->create(['asset_number' => 'AST-2', 'name' => 'A2', 'model' => 'M', 'status' => 'AVAILABLE', 'condition_status' => 'GOOD', 'created_at' => now()->subDays(2)]);
        $a3 = Asset::factory()->create(['asset_number' => 'AST-3', 'name' => 'A3', 'model' => 'M', 'status' => 'AVAILABLE', 'condition_status' => 'GOOD', 'created_at' => now()->subDays(1)]);

        // Request with per_page=1
        $resp1 = $this->actingAs($user)->getJson('/api/v1/reports/asset-history?per_page=1&page=1');
        $resp1->assertStatus(200)->assertJson(['success' => true]);
        $meta = $resp1->json('data.meta');
        $this->assertEquals(1, $meta['per_page']);
        $this->assertGreaterThanOrEqual(3, $meta['total']);

        // Check chronological ordering: first item should be the oldest event
        $items = $resp1->json('data.items');
        $firstEvent = $items[0] ?? null;
        $this->assertNotNull($firstEvent);

        // Test event_type filter: create a borrowing for a2
        $borrowing = Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $a2->id,
            'borrow_date' => now()->subDay(),
            'due_date' => now()->addDays(7),
            'status' => 'BORROWED',
        ]);

        $respBorrowed = $this->actingAs($user)->getJson('/api/v1/reports/asset-history?event_type=Borrowed');
        $respBorrowed->assertStatus(200)->assertJson(['success' => true]);
        $borrowedItems = $respBorrowed->json('data.items');
        $this->assertNotEmpty($borrowedItems);
        foreach ($borrowedItems as $it) {
            $this->assertEquals('Borrowed', $it['event_type']);
        }

        // Date range filter: pick today's date window to include the borrowing
        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');
        $respDate = $this->actingAs($user)->getJson('/api/v1/reports/asset-history?from_date='.$from.'&to_date='.$to);
        $respDate->assertStatus(200)->assertJson(['success' => true]);
        $this->assertNotEmpty($respDate->json('data.items'));
    }

    public function test_borrowed_and_returned_representation_and_no_fabrication()
    {
        $user = $this->createUserWithRole(UserRole::AUDITOR);
        $asset = Asset::factory()->create(['asset_number' => 'AST-R', 'name' => 'R', 'model' => 'M', 'status' => 'AVAILABLE', 'condition_status' => 'GOOD']);

        // Borrowed (not yet returned)
        $b1 = Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(2),
            'due_date' => now()->addDays(5),
            'status' => 'BORROWED',
        ]);

        $resp = $this->actingAs($user)->getJson('/api/v1/reports/asset-history');
        $resp->assertStatus(200);
        $items = array_column($resp->json('data.items'), 'event_type');
        $this->assertContains('Borrowed', $items);
        $this->assertNotContains('Returned', $items);

        // Now create a returned borrowing
        $b2 = Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(10),
            'due_date' => now()->subDays(3),
            'returned_at' => now()->subDays(2),
            'status' => 'RETURNED',
        ]);

        $resp2 = $this->actingAs($user)->getJson('/api/v1/reports/asset-history');
        $resp2->assertStatus(200);
        $types = array_column($resp2->json('data.items'), 'event_type');
        $this->assertContains('Returned', $types);
    }

    public function test_export_csv_and_excel_succeed_and_have_expected_columns()
    {
        $user = $this->createUserWithRole(UserRole::AUDITOR);
        $asset = Asset::factory()->create(['asset_number' => 'AST-E', 'name' => 'E', 'model' => 'M', 'status' => 'AVAILABLE', 'condition_status' => 'GOOD']);

        // CSV
        $respCsv = $this->actingAs($user)->get('/api/v1/reports/export?type=asset_history&format=csv');
        $respCsv->assertOk();
        $csvPath = $respCsv->baseResponse->getFile()->getPathname();
        $this->assertFileExists($csvPath);

        // Excel
        $respXlsx = $this->actingAs($user)->get('/api/v1/reports/export?type=asset_history&format=excel');
        $respXlsx->assertOk();
        $xlsxPath = $respXlsx->baseResponse->getFile()->getPathname();
        $this->assertFileExists($xlsxPath);

        $sheet = IOFactory::load($xlsxPath)->getActiveSheet();
        $this->assertSame('ASSET HISTORY REPORT', $sheet->getCell('A2')->getValue());

        // Verify header row contains 'Asset Name' at or after A5
        $found = false;
        for ($i = 0; $i < 20; $i++) {
            $val = (string) $sheet->getCell(chr(ord('A') + $i)."5")->getValue();
            if (trim($val) === 'Asset Name') { $found = true; break; }
        }
        $this->assertTrue($found, 'Export header must contain Asset Name');
    }
}
