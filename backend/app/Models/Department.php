<?php

namespace App\Models;

use App\Modules\Department\Models\Department as DepartmentModule;
use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends DepartmentModule
{
    /** @use HasFactory<DepartmentFactory> */
    use HasFactory;

    /**
     * Get the users that belong to the department.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
