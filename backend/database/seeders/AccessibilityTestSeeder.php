<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Enums\UserRole;
use Illuminate\Support\Facades\Hash;

class AccessibilityTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder creates a deterministic accessibility test user when
     * A11Y_TEST_EMAIL and A11Y_TEST_PASSWORD environment variables are provided.
     * The CI workflow should set these as secrets. If they are missing, the
     * seeder is a no-op and reports an informational message.
     */
    public function run()
    {
        $email = env('A11Y_TEST_EMAIL');
        $password = env('A11Y_TEST_PASSWORD');

        if (!$email || !$password) {
            $this->command->info('A11Y: A11Y_TEST_EMAIL or A11Y_TEST_PASSWORD not set; skipping AccessibilityTestSeeder.');
            return;
        }

        $existing = User::where('email', $email)->first();
        if ($existing) {
            $this->command->info("A11Y: test user {$email} already exists.");
            // Ensure the user has at least the Employee role
            $employeeRole = Role::where('name', UserRole::EMPLOYEE->value)->first();
            if ($employeeRole) {
                $existing->roles()->syncWithoutDetaching([$employeeRole->id]);
            }
            return;
        }

        // Determine a department id if available
        $departmentId = null;
        try {
            $departmentId = \App\Models\Department::query()->first()->id ?? null;
        } catch (\Throwable $e) {
            // ignore, department may not exist in minimal setups
        }

        // Create the user with minimal required fields present in this project.
        $user = User::create([
            'employee_number' => 'EMP-A11Y',
            'first_name' => 'A11Y',
            'middle_name' => null,
            'last_name' => 'TestUser',
            'email' => $email,
            'password' => Hash::make($password),
            'department_id' => $departmentId,
            'status' => 'active',
        ]);

        // Assign the Employee role so the test user can access typical employee pages
        $employeeRole = Role::where('name', UserRole::EMPLOYEE->value)->first();
        if ($employeeRole) {
            $user->roles()->syncWithoutDetaching([$employeeRole->id]);
        }

        $this->command->info("A11Y: created test user {$email}");
    }
}
