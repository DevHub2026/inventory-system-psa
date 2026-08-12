<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileNameRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_profile_via_name_splits_and_persists_first_and_last_name(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Initial',
            'last_name' => 'User',
            'password' => bcrypt('password123'),
        ]);

        $login = $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'password123']);
        $login->assertStatus(200);
        $token = $login->json('token');

        $response = $this->withToken($token)->putJson('/api/v1/profile', [
            'name' => 'Alice Smith'
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
        ]);
    }
}
