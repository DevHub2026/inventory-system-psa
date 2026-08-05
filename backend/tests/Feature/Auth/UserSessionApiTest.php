<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSessionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_retrieve_their_sessions(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'Chrome on Windows',
            'browser' => 'Chrome',
            'platform' => 'Windows',
            'ip_address' => '127.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/sessions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Sessions retrieved successfully.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'device_name',
                            'browser',
                            'platform',
                            'ip_address',
                            'login_at',
                            'last_activity',
                            'is_active',
                            'is_current',
                        ],
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_user_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/sessions');

        $response->assertStatus(401);
    }

    public function test_user_cannot_view_another_users_sessions(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $tokenA = $userA->createToken('auth')->plainTextToken;

        // User B has a session
        UserSession::create([
            'user_id' => $userB->id,
            'device_name' => 'Firefox on Linux',
            'browser' => 'Firefox',
            'platform' => 'Linux',
            'ip_address' => '10.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $response = $this->withToken($tokenA)
            ->getJson('/api/v1/sessions');

        $response->assertStatus(200);
        $items = $response->json('data.items');
        $this->assertCount(0, $items, 'User A must not see User B sessions.');
    }

    public function test_empty_session_list_is_handled(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/sessions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'items' => [],
                ],
            ]);
    }

    public function test_malformed_or_missing_session_metadata_does_not_crash(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Session with all nullable fields set to null
        UserSession::create([
            'user_id' => $user->id,
            'device_name' => null,
            'browser' => null,
            'platform' => null,
            'ip_address' => null,
            'login_at' => null,
            'last_activity' => null,
            'is_active' => true,
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/sessions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $items = $response->json('data.items');
        $this->assertCount(1, $items);
        $this->assertNull($items[0]['device_name']);
        $this->assertNull($items[0]['login_at']);
        $this->assertNull($items[0]['last_activity']);
    }

    public function test_user_can_revoke_their_own_session(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $session = UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'Chrome on Windows',
            'browser' => 'Chrome',
            'platform' => 'Windows',
            'ip_address' => '127.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $response = $this->withToken($token)
            ->postJson("/api/v1/sessions/{$session->id}/revoke");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Session revoked successfully.',
            ]);

        $this->assertFalse($session->fresh()->is_active);
    }

    public function test_user_cannot_revoke_another_users_session(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $tokenA = $userA->createToken('auth')->plainTextToken;

        $sessionB = UserSession::create([
            'user_id' => $userB->id,
            'device_name' => 'Firefox on Linux',
            'browser' => 'Firefox',
            'platform' => 'Linux',
            'ip_address' => '10.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $response = $this->withToken($tokenA)
            ->postJson("/api/v1/sessions/{$sessionB->id}/revoke");

        $response->assertStatus(404);
        $this->assertTrue($sessionB->fresh()->is_active, 'User B session must remain active.');
    }

    public function test_revoke_all_except_current_works(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Two sessions for the same user
        UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'Chrome on Windows',
            'browser' => 'Chrome',
            'platform' => 'Windows',
            'ip_address' => '127.0.0.1',
            'login_at' => now()->subMinutes(10),
            'last_activity' => now()->subMinutes(10),
            'is_active' => true,
        ]);

        UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'Edge on Windows',
            'browser' => 'Edge',
            'platform' => 'Windows',
            'ip_address' => '127.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
        ]);

        $response = $this->withToken($token)
            ->postJson('/api/v1/sessions/revoke-all');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'All other sessions revoked successfully.',
            ]);

        // At least one session should remain active (the "current" one)
        $this->assertGreaterThanOrEqual(
            1,
            UserSession::where('user_id', $user->id)->where('is_active', true)->count(),
            'At least the current session must remain active.'
        );
    }
}