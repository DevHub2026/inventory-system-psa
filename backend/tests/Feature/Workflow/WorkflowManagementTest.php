<?php

namespace Tests\Feature\Workflow;

use App\Models\User;
use App\Modules\Workflow\Enums\WorkflowModuleType;
use App\Modules\Workflow\Models\Workflow;

use App\Modules\Workflow\Models\WorkflowVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Administrator');
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;
    }

    public function test_admin_can_list_workflows_and_modules(): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/workflows/modules');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Operation completed successfully.',
            ]);

        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/workflows');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Operation completed successfully.',
            ]);
    }

    public function test_admin_can_create_a_new_workflow(): void
    {
        $payload = [
            'name' => 'Custom Borrow Workflow',
            'module_type' => WorkflowModuleType::BORROW_REQUEST->value,
            'description' => 'Test workflow for borrowing assets.',
            'is_active' => true,
            'options' => [
                'auto_approve_no_approver' => false,
                'require_remarks_on_rejection' => true,
            ],
            'approval_levels' => [
                [
                    'level_order' => 1,
                    'name' => 'Property Custodian Level',
                    'roles' => ['Property Custodian'],
                    'user_ids' => [],
                    'approval_type' => 'single',
                    'is_enabled' => true,
                ],
            ],
        ];

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/workflows', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Workflow created successfully.',
            ]);

        $this->assertDatabaseHas('workflows', [
            'name' => 'Custom Borrow Workflow',
            'module_type' => WorkflowModuleType::BORROW_REQUEST->value,
        ]);
    }

    public function test_admin_can_toggle_workflow_active_status(): void
    {
        $workflow = Workflow::query()->create([
            'name' => 'Toggle Workflow',
            'module_type' => WorkflowModuleType::BORROW_REQUEST->value,
            'is_active' => true,
            'is_archived' => false,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/workflows/{$workflow->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Workflow status updated.',
            ]);

        $this->assertDatabaseHas('workflows', [
            'id' => $workflow->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_archive_and_restore_workflow(): void
    {
        $workflow = Workflow::query()->create([
            'name' => 'Archive Workflow',
            'module_type' => WorkflowModuleType::BORROW_REQUEST->value,
            'is_active' => true,
            'is_archived' => false,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/workflows/{$workflow->id}/archive");

        $response->assertStatus(200);
        $this->assertDatabaseHas('workflows', ['id' => $workflow->id, 'is_archived' => true]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/workflows/{$workflow->id}/restore");

        $response->assertStatus(200);
        $this->assertDatabaseHas('workflows', ['id' => $workflow->id, 'is_archived' => false]);
    }
}
