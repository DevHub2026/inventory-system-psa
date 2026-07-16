<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Seed the application's departments.
     */
    public function run(): void
    {
        foreach ([
            'Administration',
            'Information and Communications Technology',
            'Statistical Operations',
        ] as $name) {
            Department::query()->firstOrCreate(['name' => $name]);
        }
    }
}
