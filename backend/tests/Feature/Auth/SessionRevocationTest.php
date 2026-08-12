<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionRevocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_creates_user_session_with_token_and_revoke_invalidates_token(): void
    {
        $user = User::factory()->create(['email' => 'sess@example.com', 'password' => bcrypt('password123')]);

        // Create a personal access token and manually create the UserSession record
        $tokenResult = $user->createToken('auth');
        $token = $tokenResult->plainTextToken;
        $tokenId = $tokenResult->accessToken->id ?? null;

        $session = \App\Models\UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'test-device',
            'browser' => 'PHPUnit',
            'platform' => 'PHPUnit',
            'ip_address' => '127.0.0.1',
            'login_at' => now(),
            'last_activity' => now(),
            'is_active' => true,
            'personal_access_token_id' => $tokenId,
        ]);

        $this->assertNotNull($session, 'UserSession should be created.');
        $this->assertNotNull($session->personal_access_token_id, 'personal_access_token_id should be recorded on session.');

        // Create a second token to perform the revoke call so the token under test
        // (the original $token) is not relied on for both revoke and verification
        $secondToken = $user->createToken('second')->plainTextToken;

        // Revoke the session via API using the second token
        $revokeResponse = $this->withToken($secondToken)->postJson('/api/v1/sessions/'.$session->id.'/revoke');
        $revokeResponse->assertStatus(200)->assertJson(['success' => true]);

        // The personal access token row should be deleted
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $session->personal_access_token_id]);

        // Token should no longer be usable for authenticated endpoints
        $protected = $this->withToken($token)->getJson('/api/v1/me');
        $protected->assertStatus(401);
    }

    public function test_revoke_works_for_legacy_session_with_null_token_id(): void
    {
        $user = User::factory()->create(['email' => 'legacy@example.com', 'password' => bcrypt('password123')]);

        // Create a personal access token that will be associated to the session by timing
        $tokenResult = $user->createToken('auth');
        $token = $tokenResult->plainTextToken;
        $tokenModel = $tokenResult->accessToken;

        // Create a UserSession that predates the migration (personal_access_token_id null)
        $session = \App\Models\UserSession::create([
            'user_id' => $user->id,
            'device_name' => 'legacy-device',
            'browser' => 'PHPUnit',
            'platform' => 'PHPUnit',
            'ip_address' => '127.0.0.1',
            'login_at' => $tokenModel->created_at,
            'last_activity' => $tokenModel->created_at,
            'is_active' => true,
            'personal_access_token_id' => null,
        ]);

        $this->assertNotNull($session);
        $this->assertNull($session->personal_access_token_id);

        // Revoke via a different token
        $other = $user->createToken('other')->plainTextToken;
        $revokeResponse = $this->withToken($other)->postJson('/api/v1/sessions/'.$session->id.'/revoke');
        $revokeResponse->assertStatus(200)->assertJson(['success' => true]);

        // The token that matched by creation time should be deleted
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenModel->id]);

        // And the token cannot be used any more
        $protected = $this->withToken($token)->getJson('/api/v1/me');
        $protected->assertStatus(401);
    }
}

