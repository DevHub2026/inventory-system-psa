<?php

namespace Tests\Feature\SystemSetup;

use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Office;
use App\Modules\Department\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteSetupTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $adminToken;
    private User $employee;
    private string $employeeToken;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles and users
        $adminRole = Role::query()->firstOrCreate(['name' => 'Super Administrator'], ['description' => 'Super admin']);
        $employeeRole = Role::query()->firstOrCreate(['name' => 'Employee'], ['description' => 'Employee']);

        $this->admin = User::factory()->create();
        $this->admin->roles()->sync([$adminRole->id]);
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;

        $this->employee = User::factory()->create();
        $this->employee->roles()->sync([$employeeRole->id]);
        $this->employeeToken = $this->employee->createToken('auth')->plainTextToken;
    }

    public function test_admin_can_delete_location(): void
    {
        $office = Office::create(['name' => 'Main Office', 'code' => 'MO', 'description' => 'Main']);
        $location = Location::create(['office_id' => $office->id, 'name' => 'Storage', 'code' => 'ST', 'description' => 'Room']);

        $response = $this->withToken($this->adminToken)
            ->deleteJson("/api/v1/locations/{$location->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertSoftDeleted('locations', ['id' => $location->id]);
    }

    public function test_delete_nonexistent_location_returns_404(): void
    {
        $response = $this->withToken($this->adminToken)
            ->deleteJson('/api/v1/locations/999999');

        $response->assertStatus(404);
    }

    public function test_employee_cannot_delete_location(): void
    {
        $office = Office::create(['name' => 'Main Office', 'code' => 'MO2', 'description' => 'Main']);
        $location = Location::create(['office_id' => $office->id, 'name' => 'Storage2', 'code' => 'ST2', 'description' => 'Room']);

        $response = $this->withToken($this->employeeToken)
            ->deleteJson("/api/v1/locations/{$location->id}");

        $response->assertStatus(403);

        // ensure still present
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    public function test_admin_can_delete_department(): void
    {
        $department = Department::create(['name' => 'Finance', 'code' => 'FIN', 'description' => '']);

        $response = $this->withToken($this->adminToken)
            ->deleteJson("/api/v1/departments/{$department->id}");

        // Debug output
        fwrite(STDERR, "DELETE /api/v1/departments/{$department->id} response: ");
        fwrite(STDERR, $response->getContent() . PHP_EOL);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertSoftDeleted('departments', ['id' => $department->id]);
    }

    public function test_delete_nonexistent_department_returns_404(): void
    {
        $response = $this->withToken($this->adminToken)
            ->deleteJson('/api/v1/departments/999999');

        $response->assertStatus(404);
    }

    public function test_employee_cannot_delete_department(): void
    {
        $department = Department::create(['name' => 'HR', 'code' => 'HR', 'description' => '']);

        $response = $this->withToken($this->employeeToken)
            ->deleteJson("/api/v1/departments/{$department->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('departments', ['id' => $department->id]);
    }
}
