<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\Asset\Services\AssetService;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $departments = $this->departments();
            $users = $this->users($departments);
            $setup = $this->setupRecords();
            $assets = $this->assets($setup);

            $this->inventoryItems($setup, $assets);
            $this->borrowings($users, $assets);
            $this->reservations($users, $assets);
            $this->maintenances($users, $assets);
        });
    }

    /**
     * @return array<string, Department>
     */
    private function departments(): array
    {
        return [
            'admin' => Department::query()->firstOrCreate(['name' => 'Administration']),
            'ict' => Department::query()->firstOrCreate(['name' => 'Information and Communications Technology']),
            'operations' => Department::query()->firstOrCreate(['name' => 'Statistical Operations']),
        ];
    }

    /**
     * @param array<string, Department> $departments
     * @return array<string, User>
     */
    private function users(array $departments): array
    {
        $password = Hash::make('password123');

        $users = [
            'admin' => $this->user('admin@example.com', 'EMP-ADMIN', 'Admin', 'User', $departments['admin'], UserRole::SUPER_ADMINISTRATOR, $password),
            'staff' => $this->user('staff@example.com', 'EMP-STAFF', 'Staff', 'User', $departments['ict'], UserRole::PROPERTY_CUSTODIAN, $password),
            'inventory' => $this->user('inventory@example.com', 'EMP-INV', 'Inventory', 'Officer', $departments['ict'], UserRole::INVENTORY_OFFICER, $password),
            'employee' => $this->user('employee@example.com', 'EMP-0001', 'Employee', 'User', $departments['operations'], UserRole::EMPLOYEE, $password),
            'requester' => $this->user('requester@example.com', 'EMP-0002', 'Maria', 'Santos', $departments['operations'], UserRole::EMPLOYEE, $password),
            'auditor' => $this->user('auditor@example.com', 'EMP-AUD', 'Audit', 'Viewer', $departments['admin'], UserRole::AUDITOR, $password),
        ];

        return $users;
    }

    private function user(
        string $email,
        string $employeeNumber,
        string $firstName,
        string $lastName,
        Department $department,
        UserRole $role,
        string $password,
    ): User {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'employee_number' => $employeeNumber,
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'password' => $password,
                'department_id' => $department->id,
                'status' => 'active',
            ],
        );

        $roleModel = Role::query()->where('name', $role->value)->firstOrFail();
        $user->roles()->syncWithoutDetaching([$roleModel->id]);

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function setupRecords(): array
    {
        $mainOffice = Office::query()->updateOrCreate(
            ['code' => 'PSA-SAR'],
            [
                'name' => 'PSA Sarangani Provincial Office',
                'description' => 'Main provincial office used for integrated testing.',
                'is_active' => true,
            ],
        );

        $fieldOffice = Office::query()->updateOrCreate(
            ['code' => 'FIELD'],
            [
                'name' => 'Field Operations Unit',
                'description' => 'Field operations storage and deployment office.',
                'is_active' => true,
            ],
        );

        $locations = [
            'it_storage' => Location::query()->updateOrCreate(
                ['code' => 'IT-STOR'],
                [
                    'office_id' => $mainOffice->id,
                    'name' => 'IT Storage Room',
                    'description' => 'Secure storage for ICT assets.',
                    'is_active' => true,
                ],
            ),
            'conference' => Location::query()->updateOrCreate(
                ['code' => 'CONF-A'],
                [
                    'office_id' => $mainOffice->id,
                    'name' => 'Conference Room A',
                    'description' => 'Shared meeting room for reservable assets.',
                    'is_active' => true,
                ],
            ),
            'field_locker' => Location::query()->updateOrCreate(
                ['code' => 'FLD-LOCK'],
                [
                    'office_id' => $fieldOffice->id,
                    'name' => 'Field Equipment Locker',
                    'description' => 'Locker for field survey equipment.',
                    'is_active' => true,
                ],
            ),
        ];

        $manufacturers = [
            'dell' => Manufacturer::query()->updateOrCreate(['name' => 'Dell'], ['description' => 'Laptop manufacturer.', 'is_active' => true]),
            'epson' => Manufacturer::query()->updateOrCreate(['name' => 'Epson'], ['description' => 'Printer manufacturer.', 'is_active' => true]),
            'canon' => Manufacturer::query()->updateOrCreate(['name' => 'Canon'], ['description' => 'Camera and imaging equipment manufacturer.', 'is_active' => true]),
            'apc' => Manufacturer::query()->updateOrCreate(['name' => 'APC'], ['description' => 'Power equipment manufacturer.', 'is_active' => true]),
            'generic' => Manufacturer::query()->updateOrCreate(['name' => 'PSA Generic'], ['description' => 'Generic PSA-managed inventory item.', 'is_active' => true]),
        ];

        $categories = [
            'laptop' => AssetCategory::query()->updateOrCreate(['code' => 'LAP'], ['name' => 'Laptop', 'description' => 'Portable computers.', 'is_active' => true]),
            'printer' => AssetCategory::query()->updateOrCreate(['code' => 'PRN'], ['name' => 'Printer', 'description' => 'Printing devices.', 'is_active' => true]),
            'projector' => AssetCategory::query()->updateOrCreate(['code' => 'PROJ'], ['name' => 'Projector', 'description' => 'Presentation equipment.', 'is_active' => true]),
            'power' => AssetCategory::query()->updateOrCreate(['code' => 'PWR'], ['name' => 'Power Equipment', 'description' => 'UPS and power protection.', 'is_active' => true]),
            'inventory' => AssetCategory::query()->updateOrCreate(['code' => 'INV'], ['name' => 'Inventory Item', 'description' => 'Inventory-linked asset records.', 'is_active' => true]),
        ];

        return [
            'offices' => ['main' => $mainOffice, 'field' => $fieldOffice],
            'locations' => $locations,
            'manufacturers' => $manufacturers,
            'categories' => $categories,
        ];
    }

    /**
     * @param array<string, mixed> $setup
     * @return array<string, Asset>
     */
    private function assets(array $setup): array
    {
        return [
            'available_laptop' => $this->asset($setup, 'PSA-LAP-2026-001', 'Dell Latitude 5440 Laptop', 'laptop', 'dell', 'it_storage', AssetStatus::AVAILABLE, [
                IdentifierType::SERIAL_NUMBER->value => 'SN-DL-5440-001',
                IdentifierType::MANUFACTURER_BARCODE->value => '890123456789',
                IdentifierType::PROPERTY_TAG->value => 'PSA-IT-2026-001',
            ]),
            'borrowed_printer' => $this->asset($setup, 'PSA-PRN-2026-001', 'Epson EcoTank L6270 Printer', 'printer', 'epson', 'it_storage', AssetStatus::BORROWED, [
                IdentifierType::SERIAL_NUMBER->value => 'SN-EP-L6270-001',
                IdentifierType::PROPERTY_TAG->value => 'PSA-OPS-2026-010',
            ]),
            'reserved_projector' => $this->asset($setup, 'PSA-PROJ-2026-001', 'Conference Projector', 'projector', 'generic', 'conference', AssetStatus::RESERVED, [
                IdentifierType::SERIAL_NUMBER->value => 'SN-PROJ-2026-001',
                IdentifierType::PROPERTY_TAG->value => 'PSA-CONF-2026-003',
            ]),
            'maintenance_ups' => $this->asset($setup, 'PSA-UPS-2026-001', 'APC Back-UPS 1500VA', 'power', 'apc', 'it_storage', AssetStatus::MAINTENANCE, [
                IdentifierType::SERIAL_NUMBER->value => 'SN-APC-1500-001',
                IdentifierType::PROPERTY_TAG->value => 'PSA-PWR-2026-002',
            ]),
            'returned_camera' => $this->asset($setup, 'PSA-CAM-2026-001', 'Canon Field Documentation Camera', 'projector', 'canon', 'field_locker', AssetStatus::AVAILABLE, [
                IdentifierType::SERIAL_NUMBER->value => 'SN-CAN-FLD-001',
                IdentifierType::MANUFACTURER_QR->value => 'CANON-FIELD-CAM-001',
                IdentifierType::PROPERTY_TAG->value => 'PSA-FLD-2026-011',
            ]),
        ];
    }

    /**
     * @param array<string, mixed> $setup
     * @param array<string, string> $identifiers
     */
    private function asset(
        array $setup,
        string $assetNumber,
        string $name,
        string $categoryKey,
        string $manufacturerKey,
        string $locationKey,
        AssetStatus $status,
        array $identifiers,
    ): Asset {
        $asset = Asset::query()->updateOrCreate(
            ['asset_number' => $assetNumber],
            [
                'name' => $name,
                'description' => 'Demo asset for relationship and workflow testing.',
                'asset_category_id' => $setup['categories'][$categoryKey]->id,
                'manufacturer_id' => $setup['manufacturers'][$manufacturerKey]->id,
                'office_id' => $setup['offices']['main']->id,
                'location_id' => $setup['locations'][$locationKey]->id,
                'model' => $assetNumber,
                'status' => $status->value,
                'condition_status' => $status === AssetStatus::MAINTENANCE ? ConditionStatus::UNDER_REPAIR->value : ConditionStatus::GOOD->value,
                'purchase_date' => now()->subMonths(8)->toDateString(),
                'purchase_cost' => 25000,
                'warranty_until' => now()->addYear()->toDateString(),
                'remarks' => 'Seeded demo record. Safe to edit during testing.',
            ],
        );

        app(AssetService::class)->ensurePsaQrIdentifier($asset);

        foreach ($identifiers as $type => $value) {
            $asset->identifiers()->updateOrCreate(
                ['identifier_value' => $value],
                ['identifier_type' => $type, 'is_primary' => false],
            );
        }

        return $asset->fresh()->load('identifiers');
    }

    /**
     * @param array<string, mixed> $setup
     * @param array<string, Asset> $assets
     */
    private function inventoryItems(array $setup, array $assets): void
    {
        $paperAsset = $this->asset($setup, 'PSA-INV-2026-001', 'A4 Copy Paper Stock', 'inventory', 'generic', 'it_storage', AssetStatus::AVAILABLE, [
            IdentifierType::PROPERTY_TAG->value => 'PSA-SUP-2026-001',
        ]);

        InventoryItem::query()->updateOrCreate(
            ['sku' => 'COPY-PAPER-A4'],
            [
                'asset_id' => $paperAsset->id,
                'name' => 'A4 Copy Paper',
                'quantity' => 12,
                'unit' => 'ream',
                'reorder_level' => 20,
                'remarks' => 'Low-stock demo item linked to an asset row.',
            ],
        );

        InventoryItem::query()->updateOrCreate(
            ['sku' => 'TONER-BLK-001'],
            [
                'asset_id' => $assets['borrowed_printer']->id,
                'name' => 'Black Printer Toner',
                'quantity' => 6,
                'unit' => 'cartridge',
                'reorder_level' => 3,
                'remarks' => 'Consumable associated with the demo printer workflow.',
            ],
        );
    }

    /**
     * @param array<string, User> $users
     * @param array<string, Asset> $assets
     */
    private function borrowings(array $users, array $assets): void
    {
        Borrowing::query()->updateOrCreate(
            [
                'user_id' => $users['employee']->id,
                'asset_id' => $assets['borrowed_printer']->id,
                'status' => 'BORROWED',
            ],
            [
                'borrow_date' => now()->subDays(2)->toDateString(),
                'due_date' => now()->addDays(5)->toDateString(),
                'remarks' => 'Active borrowing demo record.',
                'authorized_by' => $users['staff']->id,
                'authorized_at' => now()->subDays(2),
            ],
        );

        $returned = Borrowing::query()->updateOrCreate(
            [
                'user_id' => $users['requester']->id,
                'asset_id' => $assets['returned_camera']->id,
                'status' => 'RETURNED',
            ],
            [
                'borrow_date' => now()->subDays(12)->toDateString(),
                'due_date' => now()->subDays(5)->toDateString(),
                'remarks' => 'Returned borrowing demo record.',
                'authorized_by' => $users['staff']->id,
                'authorized_at' => now()->subDays(12),
            ],
        );

        if (Schema::hasColumn('borrowings', 'returned_at')) {
            $returned->returned_at = now()->subDays(5);
            $returned->save();
        }
    }

    /**
     * @param array<string, User> $users
     * @param array<string, Asset> $assets
     */
    private function reservations(array $users, array $assets): void
    {
        $reservation = Reservation::query()->updateOrCreate(
            [
                'user_id' => $users['requester']->id,
                'status' => 'PENDING',
            ],
            [
                'start_date' => now()->addDay()->toDateString(),
                'end_date' => now()->addDays(3)->toDateString(),
                'remarks' => 'Pending projector reservation for staff approval testing.',
                'authorized_by' => null,
                'authorized_at' => null,
            ],
        );

        $reservation->assets()->sync([$assets['reserved_projector']->id]);
    }

    /**
     * @param array<string, User> $users
     * @param array<string, Asset> $assets
     */
    private function maintenances(array $users, array $assets): void
    {
        Maintenance::query()->updateOrCreate(
            [
                'asset_id' => $assets['maintenance_ups']->id,
                'status' => 'scheduled',
            ],
            [
                'user_id' => $users['inventory']->id,
                'type' => 'preventive',
                'scheduled_date' => now()->addDays(2)->toDateString(),
                'completed_date' => null,
                'description' => 'Battery health inspection before field deployment.',
                'notes' => 'Seeded maintenance task for workflow testing.',
                'cost' => 0,
            ],
        );
    }
}
