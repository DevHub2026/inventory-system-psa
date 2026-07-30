<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Department;
use App\Models\Office;
use App\Models\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['employee_number', 'username', 'first_name', 'middle_name', 'last_name', 'email', 'password', 'department_id', 'office_id', 'status', 'created_by', 'updated_by', 'deleted_by'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the roles that belong to the user.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    /**
     * Get the department that the user belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the office that the user belongs to.
     */
    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * Get the borrows that belong to the user.
     */
    public function borrows()
    {
        return $this->hasMany(\App\Modules\Borrowing\Models\Borrowing::class);
    }

    /**
     * Get the user sessions.
     */
    public function sessions()
    {
        return $this->hasMany(UserSession::class);
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * @param  list<string>  $roleNames
     */
    public function hasAnyRole(array $roleNames): bool
    {
        if ($roleNames === []) {
            return false;
        }

        return $this->roles()->whereIn('name', $roleNames)->exists();
    }

    /**
     * Assets for which this user is the current permanent accountable holder.
     */
    public function permanentlyIssuedAssets()
    {
        return $this->hasMany(\App\Modules\Asset\Models\Asset::class, 'issued_to_user_id');
    }

    /**
     * Assign a role by name while preserving existing role assignments.
     */
    public function assignRole(string $roleName): void
    {
        $role = Role::query()->firstOrCreate(
            ['name' => $roleName],
            ['description' => $roleName],
        );

        $this->roles()->syncWithoutDetaching([$role->id]);
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($query) => $query->where('name', $permissionName))
            ->exists();
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
