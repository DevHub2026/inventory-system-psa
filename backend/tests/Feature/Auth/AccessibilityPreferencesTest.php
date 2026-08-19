<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;

class AccessibilityPreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_and_retrieve_their_accessibility_preferences(): void
    {
        $user = User::factory()->create();
        $user->roles()->detach();
        $user->assignRole(UserRole::EMPLOYEE->value);

        $this->actingAs($user, 'sanctum');

        $payload = [
            'fontSize' => 'large',
            'highContrast' => true,
            'reducedMotion' => false,
        ];

        $response = $this->putJson('/api/v1/me/accessibility-preferences', $payload);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonPath('data.font_size', 'large');
        $response->assertJsonPath('data.high_contrast', true);
        $response->assertJsonPath('data.reduced_motion', false);

        // Ensure DB saved value
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);

        $fresh = $user->fresh();
        $prefs = $fresh->accessibility_preferences ?? [];
        $this->assertSame('large', $prefs['font_size'] ?? null);
        $this->assertTrue($prefs['high_contrast'] ?? false);
        $this->assertFalse($prefs['reduced_motion'] ?? false);

        // Me should include transformed preferences
        $meResp = $this->getJson('/api/v1/me')->assertStatus(200);
        $meResp->assertJson(fn (AssertableJson $json) =>
            $json->where('success', true)
                ->where('data.accessibility_preferences.fontSize', 'large')
                ->where('data.accessibility_preferences.highContrast', true)
                ->where('data.accessibility_preferences.reducedMotion', false)
                ->etc()
        );
    }

    public function test_default_preferences_are_applied_when_none_exist(): void
    {
        $user = User::factory()->create();
        $user->roles()->detach();
        $user->assignRole(UserRole::EMPLOYEE->value);

        $this->actingAs($user, 'sanctum');

        $meResp = $this->getJson('/api/v1/me')->assertStatus(200);
        $meResp->assertJson(fn (AssertableJson $json) =>
            $json->where('success', true)
                ->where('data.accessibility_preferences.fontSize', 'default')
                ->where('data.accessibility_preferences.highContrast', false)
                ->where('data.accessibility_preferences.reducedMotion', false)
                ->etc()
        );
    }

    public function test_invalid_values_are_rejected(): void
    {
        $user = User::factory()->create();
        $user->roles()->detach();
        $user->assignRole(UserRole::EMPLOYEE->value);

        $this->actingAs($user, 'sanctum');

        $resp = $this->putJson('/api/v1/me/accessibility-preferences', ['fontSize' => 'huge']);
        $resp->assertStatus(422);
    }

    public function test_user_cannot_modify_another_users_preferences_via_endpoint(): void
    {
        $userA = User::factory()->create();
        $userA->roles()->detach();
        $userA->assignRole('Employee');

        $userB = User::factory()->create();
        $userB->roles()->detach();
        $userB->assignRole('Employee');

        $this->actingAs($userA, 'sanctum');

        // userA updates their own preferences
        $this->putJson('/api/v1/me/accessibility-preferences', ['fontSize' => 'large'])->assertStatus(200);

        $freshA = $userA->fresh();
        $freshB = $userB->fresh();

        $prefsA = $freshA->accessibility_preferences ?? [];
        $prefsB = $freshB->accessibility_preferences ?? [];

        $this->assertSame('large', $prefsA['font_size'] ?? null);
        $this->assertTrue(empty($prefsB));
    }
}
