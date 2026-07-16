<?php

namespace Tests\Feature\AuditLog;

use App\Models\User;
use App\Modules\AuditLog\Models\AuditLog;
use App\Modules\AuditLog\Services\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_audit_logs(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $auditService = app(AuditLogService::class);
        $auditService->log('LOGIN', 'Auth', 'User logged in', null, null, $user->id);

        $response = $this->withToken($token)
            ->getJson('/api/v1/audit-logs');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Audit logs retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('LOGIN', $data[0]['action']);
        $this->assertEquals('Auth', $data[0]['module']);
    }

    public function test_authenticated_user_can_filter_audit_logs_by_module(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $auditService = app(AuditLogService::class);
        $auditService->log('LOGIN', 'Auth', 'User logged in', null, null, $user->id);
        $auditService->log('CREATE', 'Asset', 'Asset created', null, null, $user->id);

        $response = $this->withToken($token)
            ->getJson('/api/v1/audit-logs?module=Auth');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Audit logs retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Auth', $data[0]['module']);
    }

    public function test_authenticated_user_can_get_user_activity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $auditService = app(AuditLogService::class);
        $auditService->log('LOGIN', 'Auth', 'User logged in', null, null, $user->id);
        $auditService->log('LOGOUT', 'Auth', 'User logged out', null, null, $user->id);

        $response = $this->withToken($token)
            ->getJson('/api/v1/audit-logs/user/'.$user->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User activity retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_authenticated_user_can_get_module_activity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $auditService = app(AuditLogService::class);
        $auditService->log('CREATE', 'Asset', 'Asset created', null, null, $user->id);
        $auditService->log('UPDATE', 'Asset', 'Asset updated', null, null, $user->id);

        $response = $this->withToken($token)
            ->getJson('/api/v1/audit-logs/module/Asset');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Module activity retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_audit_service_logs_with_old_and_new_values(): void
    {
        $user = User::factory()->create();

        $auditService = app(AuditLogService::class);
        $log = $auditService->log(
            'UPDATE',
            'Asset',
            'Asset status changed',
            ['status' => 'AVAILABLE'],
            ['status' => 'BORROWED'],
            $user->id
        );

        $this->assertDatabaseHas('audit_logs', [
            'id' => $log->id,
            'action' => 'UPDATE',
            'module' => 'Asset',
        ]);

        $this->assertEquals(['status' => 'AVAILABLE'], $log->old_values);
        $this->assertEquals(['status' => 'BORROWED'], $log->new_values);
    }
}
