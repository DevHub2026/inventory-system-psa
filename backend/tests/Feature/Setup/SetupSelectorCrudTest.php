<?php

namespace Tests\Feature\Setup;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Models\Office;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Verifies the backend half of the SetupDropdown quick-add flow used inside
 * the Inventory Add/Edit modal.
 *
 * The SetupDropdown component calls setupService.list() to populate options
 * and setupService.create() when the user clicks "+ Add New".  These tests
 * confirm that:
 *
 *  1. An authorized user can LIST every setup resource and receives the
 *     double-wrapped paginated shape {data:{data:[...]}} that
 *     setupService.collectionItems() expects.
 *  2. An authorized user can CREATE every setup resource and receives 201
 *     with {data:{id, name}} — the shape setupService.create() unwraps.
 *  3. A user without the required role (Employee) is rejected with 403
 *     on create for restricted resources, while still being able to READ
 *     units (read is open to all authenticated users).
 *  4. After creating a record, a subsequent LIST includes it — verifying
 *     the create→refresh→select flow's backend half.
 */
class SetupSelectorCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $employee;
    private string $adminToken;
    private string $employeeToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->roles()->detach();
        $this->admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);
        $this->adminToken = $this->admin->createToken('test')->plainTextToken;

        $this->employee = User::factory()->create();
        $this->employee->roles()->detach();
        $this->employee->assignRole(UserRole::EMPLOYEE->value);
        $this->employeeToken = $this->employee->createToken('test')->plainTextToken;
    }

    // ── Item 1: LIST returns the double-wrapped paginated shape ────────────

    public static function setupResources(): array
    {
        return [
            'asset-categories' => ['asset-categories'],
            'offices'          => ['offices'],
            'locations'        => ['locations'],
            'manufacturers'    => ['manufacturers'],
            'units'            => ['units'],
        ];
    }

    #[DataProvider('setupResources')]
    public function test_authorized_user_can_list_setup_resource(string $endpoint): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson("/api/v1/{$endpoint}");

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => ['data'],
        ]);

        // The frontend's collectionItems() expects data.data to be an array.
        $this->assertIsArray($response->json('data.data'));
    }

    // ── Item 2: CREATE returns 201 with {data:{id, name}} ──────────────────

    public function test_authorized_user_can_create_asset_category(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/asset-categories', [
                'name' => 'IT Equipment',
                'code' => 'IT-EQ',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'IT Equipment');
        $this->assertNotNull($response->json('data.id'));
        $this->assertDatabaseHas('asset_categories', ['name' => 'IT Equipment']);
    }

    public function test_authorized_user_can_create_office(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/offices', [
                'name' => 'Test Office Alpha',
                'code' => 'TST-OFC-A',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Test Office Alpha');
        $this->assertNotNull($response->json('data.id'));
        $this->assertDatabaseHas('offices', ['name' => 'Test Office Alpha']);
    }

    public function test_authorized_user_can_create_manufacturer(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/manufacturers', [
                'name' => 'Lenovo',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Lenovo');
        $this->assertNotNull($response->json('data.id'));
        $this->assertDatabaseHas('manufacturers', ['name' => 'Lenovo']);
    }

    public function test_authorized_user_can_create_location(): void
    {
        $office = Office::query()->create([
            'name' => 'Storage Office', 'code' => 'STOR', 'is_active' => true,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/locations', [
                'name'      => 'Room 101',
                'code'      => 'R101',
                'office_id' => $office->id,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Room 101');
        $this->assertNotNull($response->json('data.id'));
        $this->assertDatabaseHas('locations', ['name' => 'Room 101']);
    }

    public function test_authorized_user_can_create_unit(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/units', [
                'name' => 'Pieces',
                'code' => 'PCS',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Pieces');
        $this->assertNotNull($response->json('data.id'));
        $this->assertDatabaseHas('units', ['name' => 'Pieces']);
    }

    // ── Item 3: Unauthorized CREATE is rejected with 403 ───────────────────

    #[DataProvider('setupResources')]
    public function test_employee_cannot_create_setup_resource(string $endpoint): void
    {
        $payload = $endpoint === 'locations'
            ? ['name' => 'Unauthorized Loc']
            : ['name' => 'Unauthorized Rec'];

        $response = $this->withToken($this->employeeToken)
            ->postJson("/api/v1/{$endpoint}", $payload);

        $response->assertForbidden();
        $response->assertJsonPath('success', false);
    }

    public function test_employee_can_read_units(): void
    {
        // Units read is open to all authenticated users (Inventory form needs it).
        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/units');

        $response->assertOk();
        $this->assertIsArray($response->json('data.data'));
    }

    // ── Item 4: After create, a subsequent LIST includes the new record ────

    public function test_created_asset_category_appears_in_list_after_refresh(): void
    {
        // 1. Create
        $createResponse = $this->withToken($this->adminToken)
            ->postJson('/api/v1/asset-categories', [
                'name' => 'Furniture',
                'code' => 'FURN',
            ]);
        $createResponse->assertCreated();
        $newId = $createResponse->json('data.id');
        $this->assertNotNull($newId);

        // 2. Refresh (the onRefreshNeeded call in SetupDropdown)
        $listResponse = $this->withToken($this->adminToken)
            ->getJson('/api/v1/asset-categories');
        $listResponse->assertOk();

        // 3. The new record must appear in the list
        $items = $listResponse->json('data.data');
        $found = collect($items)->firstWhere('id', $newId);
        $this->assertNotNull($found, 'Newly created Asset Category must appear in the list after refresh.');
        $this->assertSame('Furniture', $found['name']);
    }

    public function test_created_manufacturer_appears_in_list_after_refresh(): void
    {
        $createResponse = $this->withToken($this->adminToken)
            ->postJson('/api/v1/manufacturers', ['name' => 'Dell']);
        $createResponse->assertCreated();
        $newId = $createResponse->json('data.id');

        $listResponse = $this->withToken($this->adminToken)
            ->getJson('/api/v1/manufacturers');
        $listResponse->assertOk();

        $items = $listResponse->json('data.data');
        $found = collect($items)->firstWhere('id', $newId);
        $this->assertNotNull($found, 'Newly created Manufacturer must appear in the list after refresh.');
        $this->assertSame('Dell', $found['name']);
    }

    // ── Unauthenticated requests are rejected ─────────────────────────────

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/asset-categories')->assertUnauthorized();
        $this->postJson('/api/v1/asset-categories', ['name' => 'X'])->assertUnauthorized();
    }
}
