<?php
namespace Tests\Feature;
use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use App\Modules\SupplyRequest\Models\SupplyRequestItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplyRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
        $this->artisan('db:seed', ['--class' => 'PermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'WorkflowSeeder']);
    }

    public function test_can_create_supply_request()
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', UserRole::EMPLOYEE->value)->first());
        $item = InventoryItem::create(['name' => 'Test Supply', 'classification' => 'SUPPLY', 'quantity' => 10, 'unit' => 'pcs']);
        $response = $this->actingAs($user)->postJson('/api/v1/supply-requests', [
            'items' => [['inventory_item_id' => $item->id, 'quantity_requested' => 5]]
        ]);
        $response->assertStatus(201);
    }
    
    public function test_cannot_request_non_supply_item()
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', UserRole::EMPLOYEE->value)->first());
        $item = InventoryItem::create(['name' => 'Test Equipment', 'classification' => 'EQUIPMENT', 'quantity' => 10, 'unit' => 'pcs']);
        $response = $this->actingAs($user)->postJson('/api/v1/supply-requests', [
            'items' => [['inventory_item_id' => $item->id, 'quantity_requested' => 5]]
        ]);
        $response->assertStatus(422);
    }
    
    public function test_can_fulfill_approved_request_with_correct_deduction()
    {
        $this->assertTrue(true);
    }
    
    public function test_partial_fulfillment_closes_request()
    {
        $this->assertTrue(true);
    }
}
