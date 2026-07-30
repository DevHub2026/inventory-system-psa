<?php

namespace Tests\Feature\Asset;

use App\Enums\UserRole;
use App\Models\Asset;
use App\Models\Department;
use App\Models\Office;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IssuanceUserSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $custodian;

    protected function setUp(): void
    {
        parent::setUp();

        $this->custodian = User::factory()->create();
        $this->custodian->roles()->detach();
        $this->custodian->assignRole(UserRole::PROPERTY_CUSTODIAN->value);
    }

    public function test_issuance_user_search_matches_department_and_office(): void
    {
        $office = Office::factory()->create(['name' => 'Koronadal Field Office']);
        $department = Department::factory()->create(['name' => 'Information Technology']);

        $target = User::factory()->create([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'employee_number' => 'EMP-7788',
            'email' => 'maria.santos@psa.gov.ph',
            'office_id' => $office->id,
            'department_id' => $department->id,
            'status' => 'active',
        ]);
        $target->roles()->detach();

        Asset::factory()->create([
            'issued_to_user_id' => $target->id,
            'issued_to' => $target->full_name,
            'date_issued' => '2026-07-01',
        ]);

        $this->actingAs($this->custodian)
            ->getJson('/api/v1/permanent-issuances/users/search?search=Information%20Technology')
            ->assertOk()
            ->assertJsonFragment(['id' => $target->id]);

        $this->actingAs($this->custodian)
            ->getJson('/api/v1/permanent-issuances/users/search?search=Koronadal')
            ->assertOk()
            ->assertJsonFragment(['id' => $target->id]);

        $this->actingAs($this->custodian)
            ->getJson('/api/v1/permanent-issuances/users/search?search=EMP-7788')
            ->assertOk()
            ->assertJsonFragment(['id' => $target->id]);
    }

    public function test_employee_cannot_use_issuance_user_search(): void
    {
        $employee = User::factory()->create();
        $employee->roles()->detach();
        $employee->assignRole(UserRole::EMPLOYEE->value);

        $this->actingAs($employee)
            ->getJson('/api/v1/permanent-issuances/users/search?search=test')
            ->assertStatus(403);
    }
}
