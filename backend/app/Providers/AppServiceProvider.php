<?php

namespace App\Providers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Policies\PermissionPolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        \App\Modules\Inventory\Models\InventoryItem::class;
        // Register InventoryItem policy
        Gate::policy(\App\Modules\Inventory\Models\InventoryItem::class, \App\Policies\InventoryItemPolicy::class);

        // Centralized case-insensitive 'like' helper for searchable fields.
        // Usage: ->whereLikeInsensitive(['first_name', 'last_name'], $search)
        \Illuminate\Database\Eloquent\Builder::macro('whereLikeInsensitive', function ($columns, $search) {
            /** @var \Illuminate\Database\Eloquent\Builder $this */
            $columns = is_array($columns) ? $columns : [$columns];
            $term = '%'.mb_strtolower((string) $search).'%';

            return $this->where(function ($q) use ($columns, $term) {
                foreach ($columns as $col) {
                    // Wrap column name to prevent SQL errors when table-qualified.
                    $wrapped = \Illuminate\Support\Facades\DB::getQueryGrammar()->wrap($col);
                    $q->orWhereRaw("LOWER({$wrapped}) LIKE ?", [$term]);
                }
            });
        });
    }
}
