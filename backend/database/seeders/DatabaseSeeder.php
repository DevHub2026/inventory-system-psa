<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            RoleSeeder::class,
        ]);

        $departmentId = Department::query()->firstOrFail()->id;
        $password = Hash::make('password123');

        // Admin user with Super Administrator role
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'employee_number' => 'EMP-ADMIN',
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'User',
                'password' => $password,
                'department_id' => $departmentId,
                'status' => 'active',
            ]
        );
        $adminRole = Role::where('name', UserRole::SUPER_ADMINISTRATOR->value)->first();
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        // Staff user with Property Custodian role
        $staff = User::firstOrCreate(
            ['email' => 'staff@example.com'],
            [
                'employee_number' => 'EMP-STAFF',
                'first_name' => 'Staff',
                'middle_name' => null,
                'last_name' => 'User',
                'password' => $password,
                'department_id' => $departmentId,
                'status' => 'active',
            ]
        );
        $staffRole = Role::where('name', UserRole::PROPERTY_CUSTODIAN->value)->first();
        $staff->roles()->syncWithoutDetaching([$staffRole->id]);

        // Employee user with Employee role
        $employee = User::firstOrCreate(
            ['email' => 'employee@example.com'],
            [
                'employee_number' => 'EMP-0001',
                'first_name' => 'Employee',
                'middle_name' => null,
                'last_name' => 'User',
                'password' => $password,
                'department_id' => $departmentId,
                'status' => 'active',
            ]
        );
        $employeeRole = Role::where('name', UserRole::EMPLOYEE->value)->first();
        $employee->roles()->syncWithoutDetaching([$employeeRole->id]);
    }
}
