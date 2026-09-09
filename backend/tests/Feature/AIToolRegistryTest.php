<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Modules\AI\Services\AIToolRegistry;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AIToolRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected AIToolRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Permission::create(['name' => 'inventory.view', 'module' => 'inventory']);
        Permission::create(['name' => 'nav.reservations', 'module' => 'reservations']);
        $this->registry = app(AIToolRegistry::class);
    }

    public function test_calculate_tool()
    {
        $user = User::factory()->create();
        $result = $this->registry->executeTool('calculate', ['expression' => '15 + 20 * 2'], $user);
        $this->assertTrue($result['success']);
        $this->assertEquals(55, $result['data']['result']);
    }

    public function test_unauthorized_tool_execution()
    {
        $user = User::factory()->create();
        $result = $this->registry->executeTool('get_inventory_summary', ['classification' => 'ALL'], $user);
        $this->assertFalse($result['success']);
    }
}
