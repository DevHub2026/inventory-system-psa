<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'nav.dashboard', 'module' => 'Navigation', 'description' => 'See Dashboard in sidebar'],
            ['name' => 'nav.assets', 'module' => 'Navigation', 'description' => 'See Assets in sidebar'],
            ['name' => 'nav.inventory', 'module' => 'Navigation', 'description' => 'See Inventory in sidebar'],
            ['name' => 'nav.borrowings', 'module' => 'Navigation', 'description' => 'See Borrowed Items in sidebar'],
            ['name' => 'nav.reservations', 'module' => 'Navigation', 'description' => 'See Borrow Requests in sidebar'],
            ['name' => 'nav.issued_assets', 'module' => 'Navigation', 'description' => 'See Issued Assets in sidebar'],
            ['name' => 'nav.extension_requests', 'module' => 'Navigation', 'description' => 'See Extension Requests in sidebar'],
            ['name' => 'nav.maintenance', 'module' => 'Navigation', 'description' => 'See Maintenance in sidebar'],
            ['name' => 'nav.reports', 'module' => 'Navigation', 'description' => 'See Reports in sidebar'],
            ['name' => 'nav.history', 'module' => 'Navigation', 'description' => 'See History in sidebar'],
            ['name' => 'nav.users', 'module' => 'Navigation', 'description' => 'See Users in sidebar'],
            ['name' => 'nav.roles', 'module' => 'Navigation', 'description' => 'See Roles & Permissions in sidebar'],
            ['name' => 'nav.system_setup', 'module' => 'Navigation', 'description' => 'See System Setup in sidebar'],
            ['name' => 'nav.workflows', 'module' => 'Navigation', 'description' => 'See Approval Workflows in sidebar'],
            ['name' => 'nav.audit_logs', 'module' => 'Navigation', 'description' => 'See Audit Logs in sidebar'],
            ['name' => 'nav.qr_scan_history', 'module' => 'Navigation', 'description' => 'See QR Scan History in sidebar'],
            ['name' => 'nav.faqs', 'module' => 'Navigation', 'description' => 'See FAQ Management in sidebar'],
            
            ['name' => 'manage users', 'module' => 'User', 'description' => 'Create, update, delete users'],
            ['name' => 'manage roles', 'module' => 'Role', 'description' => 'Create, update, delete roles and assign permissions'],
            ['name' => 'manage permissions', 'module' => 'Permission', 'description' => 'Create and manage raw permissions'],
            
            ['name' => 'assets.create', 'module' => 'Asset', 'description' => 'Create new asset records'],
            ['name' => 'assets.edit', 'module' => 'Asset', 'description' => 'Update asset records'],
            ['name' => 'assets.delete', 'module' => 'Asset', 'description' => 'Delete asset records'],
            ['name' => 'assets.issue', 'module' => 'Asset', 'description' => 'Permanently issue assets to employees'],
            ['name' => 'assets.dispose', 'module' => 'Asset', 'description' => 'Manage asset disposal workflow'],
            
            ['name' => 'inventory.view', 'module' => 'Inventory', 'description' => 'Access inventory module'],
            ['name' => 'inventory.create', 'module' => 'Inventory', 'description' => 'Add new inventory items'],
            ['name' => 'inventory.edit', 'module' => 'Inventory', 'description' => 'Edit existing inventory items'],
            ['name' => 'inventory.delete', 'module' => 'Inventory', 'description' => 'Delete inventory items'],
            
            ['name' => 'borrowings.approve', 'module' => 'Borrowing', 'description' => 'Approve/reject borrow requests and returns'],
            ['name' => 'reservations.approve', 'module' => 'Reservation', 'description' => 'Approve/reject reservations'],
            ['name' => 'extensions.approve', 'module' => 'Borrowing', 'description' => 'Approve/reject borrow extension requests'],
            
            ['name' => 'reports.view', 'module' => 'Report', 'description' => 'Access reports module'],
            ['name' => 'reports.export', 'module' => 'Report', 'description' => 'Export reports'],
            
            ['name' => 'history.view', 'module' => 'History', 'description' => 'Access history module'],
            ['name' => 'history.clear', 'module' => 'History', 'description' => 'Clear history records'],
            
            ['name' => 'manage faqs', 'module' => 'Faq', 'description' => 'Create, update, delete FAQ entries'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        $rolesMap = [
            'Super Administrator' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.users', 'nav.roles', 'nav.system_setup', 'nav.workflows', 'nav.audit_logs', 'nav.qr_scan_history', 'nav.faqs',
                'manage users', 'manage roles', 'manage permissions', 'manage faqs',
                'assets.create', 'assets.edit', 'assets.delete', 'assets.issue', 'assets.dispose',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view', 'history.clear'
            ],
            'System Administrator' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.users', 'nav.roles', 'nav.system_setup', 'nav.workflows', 'nav.qr_scan_history', 'nav.faqs',
                'manage users', 'manage roles', 'manage faqs',
                'assets.create', 'assets.edit', 'assets.delete', 'assets.issue', 'assets.dispose',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
            'Property Custodian' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.qr_scan_history',
                'assets.issue', 'assets.dispose',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
            'Inventory Officer' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.qr_scan_history',
                'assets.issue', 'assets.dispose',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
            'Department Head' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.qr_scan_history',
                'assets.dispose',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
            'Employee' => [
                'nav.dashboard', 'nav.assets', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets'
            ],
            'Auditor' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.qr_scan_history',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
            'Supply Officer' => [
                'nav.dashboard', 'nav.assets', 'nav.inventory', 'nav.borrowings', 'nav.reservations', 'nav.issued_assets', 'nav.extension_requests', 'nav.maintenance', 'nav.reports', 'nav.history', 'nav.qr_scan_history',
                'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
                'borrowings.approve', 'reservations.approve', 'extensions.approve',
                'reports.view', 'reports.export',
                'history.view'
            ],
        ];

        foreach ($rolesMap as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName], ['description' => $roleName . ' Role']);
            if ($role) {
                $permIds = Permission::whereIn('name', $perms)->pluck('id')->toArray();
                $role->permissions()->sync($permIds);
            }
        }
    }
}
