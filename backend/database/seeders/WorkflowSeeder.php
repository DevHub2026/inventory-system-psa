<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Workflow\Enums\WorkflowModuleType;
use App\Modules\Workflow\Services\WorkflowService;
use Illuminate\Database\Seeder;

class WorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            return;
        }

        $service = app(WorkflowService::class);

        $defaultWorkflows = [
            [
                'name' => 'Standard Borrow Request Approval',
                'module_type' => WorkflowModuleType::BORROW_REQUEST->value,
                'description' => 'Default 2-tier approval workflow for employee equipment borrow requests.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Custodian Verification',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                    [
                        'level_order' => 2,
                        'name' => 'Department Head Authorization',
                        'roles' => ['Department Head', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Borrow Extension Approval',
                'module_type' => WorkflowModuleType::BORROW_EXTENSION->value,
                'description' => 'Approval process for extending return due dates on borrowed assets.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Custodian Approval',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Initial Asset Issuance Approval',
                'module_type' => WorkflowModuleType::ASSET_ISSUANCE->value,
                'description' => 'Workflow for initial permanent asset assignment to personnel.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Custodian Review',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Asset Re-Issuance Transfer Approval',
                'module_type' => WorkflowModuleType::ASSET_REISSUANCE->value,
                'description' => 'Workflow for transferring asset accountability from one employee to another.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Custodian Validation',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Property Clearance Approval',
                'module_type' => WorkflowModuleType::CLEARANCE_PROCESSING->value,
                'description' => 'Property clearance verification for resigning or transferring personnel.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Accountability Check',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                    [
                        'level_order' => 2,
                        'name' => 'Administrative Clearance Sign-off',
                        'roles' => ['Department Head', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Maintenance & Repair Request Approval',
                'module_type' => WorkflowModuleType::MAINTENANCE_REQUEST->value,
                'description' => 'Approval flow for damaged or defective asset repair requests.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Inventory Technical Assessment',
                        'roles' => ['Inventory Officer', 'Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
            [
                'name' => 'Lost Asset Report Review',
                'module_type' => WorkflowModuleType::LOST_ASSET_REPORT->value,
                'description' => 'Approval workflow for employee-submitted lost asset reports.',
                'is_active' => true,
                'approval_levels' => [
                    [
                        'level_order' => 1,
                        'name' => 'Property Custodian Review',
                        'roles' => ['Property Custodian', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                    [
                        'level_order' => 2,
                        'name' => 'Department Head Confirmation',
                        'roles' => ['Department Head', 'System Administrator', 'Super Administrator'],
                        'approval_type' => 'any',
                        'is_enabled' => true,
                    ],
                ],
            ],
        ];

        foreach ($defaultWorkflows as $data) {
            $exists = \App\Modules\Workflow\Models\Workflow::where('module_type', $data['module_type'])->exists();
            if (! $exists) {
                $service->create($admin, $data);
            }
        }
    }
}
