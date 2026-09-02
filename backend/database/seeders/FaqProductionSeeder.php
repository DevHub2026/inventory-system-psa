<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;

class FaqProductionSeeder extends Seeder
{
    /**
     * Seed the production FAQs without destructively touching existing records.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'How do I update my profile and password?',
                'answer' => 'Open the Settings page from the navigation menu or dashboard. Here you can update your personal information, change your password, and adjust your accessibility preferences.',
                'category' => 'Account & Access',
                'keywords' => ['profile', 'password', 'settings', 'account'],
                'roles' => [],
                'destination' => '/settings',
                'actions' => [
                    ['label' => 'Open Settings', 'type' => 'route', 'target' => '/settings'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How do I report a damaged asset?',
                'answer' => 'Open the Assets or Inventory page, find the specific asset, and view its details. From there, select the action to report damage or request maintenance. This will flag the item and alert the maintenance team.',
                'category' => 'Maintenance',
                'keywords' => ['damage', 'broken', 'repair', 'maintenance', 'report'],
                'roles' => [UserRole::EMPLOYEE->value, UserRole::DEPARTMENT_HEAD->value, UserRole::INVENTORY_OFFICER->value, UserRole::PROPERTY_CUSTODIAN->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value, UserRole::SUPPLY_OFFICER->value],
                'destination' => '/maintenance',
                'actions' => [
                    ['label' => 'Open Maintenance', 'type' => 'route', 'target' => '/maintenance'],
                    ['label' => 'Open Assets', 'type' => 'route', 'target' => '/assets'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How does maintenance status work?',
                'answer' => 'When an asset is marked for repair, its status changes to "Under Maintenance". While in this state, the asset cannot be borrowed, reserved, or issued to users. Once the maintenance log is resolved, the status returns to Available.',
                'category' => 'Maintenance',
                'keywords' => ['status', 'maintenance', 'unavailable', 'repair'],
                'roles' => [UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::SYSTEM_ADMINISTRATOR->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SUPPLY_OFFICER->value],
                'destination' => '/maintenance',
                'actions' => [
                    ['label' => 'Open Maintenance', 'type' => 'route', 'target' => '/maintenance'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How do I report a lost asset?',
                'answer' => 'Go to the asset\'s detail page and use the specific action to report it as lost. This triggers a formal lost-asset workflow (found under Reports -> Lost Assets) which requires administrative review and documentation before the item is written off.',
                'category' => 'Lost Assets',
                'keywords' => ['lost', 'missing', 'report', 'write off'],
                'roles' => [UserRole::EMPLOYEE->value, UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::DEPARTMENT_HEAD->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/reports/lost-assets',
                'actions' => [
                    ['label' => 'View Lost Assets', 'type' => 'route', 'target' => '/reports/lost-assets'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How do I export inventory or report data?',
                'answer' => 'Navigate to the Reports page or Inventory list. Configure your search filters and date ranges, then look for the Export button on the page to download your current view as a document (e.g., CSV or PDF) for external reporting.',
                'category' => 'Reports & Exports',
                'keywords' => ['export', 'download', 'csv', 'pdf', 'excel'],
                'roles' => [UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value, UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::DEPARTMENT_HEAD->value, UserRole::AUDITOR->value, UserRole::SUPPLY_OFFICER->value],
                'destination' => '/reports',
                'actions' => [
                    ['label' => 'Open Reports', 'type' => 'route', 'target' => '/reports'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How does Supply Officer access differ from other roles?',
                'answer' => 'The Supply Officer role is strictly scoped to managing items classified as "SUPPLY". They cannot manage, issue, or configure properties classified as "PPE" (Property, Plant, and Equipment) or "SE" (Semi-Expendable property).',
                'category' => 'Users & Roles',
                'keywords' => ['supply officer', 'supply', 'ppe', 'se', 'classification'],
                'roles' => [UserRole::SUPPLY_OFFICER->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/inventory',
                'actions' => [
                    ['label' => 'Open Inventory', 'type' => 'route', 'target' => '/inventory'],
                ],
                'active' => true,
            ],
            [
                'question' => 'How do I manage FAQs?',
                'answer' => 'Open the FAQ Management page located under the Admin section in your sidebar. From there, you can create new FAQs, edit existing ones, toggle their active status, and assign them to specific roles.',
                'category' => 'System Administration',
                'keywords' => ['faq', 'manage', 'help', 'accessibility'],
                'roles' => [UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/faqs',
                'actions' => [
                    ['label' => 'Manage FAQs', 'type' => 'route', 'target' => '/faqs'],
                ],
                'active' => true,
            ],
            [
                'question' => 'What happens when an asset is unavailable?',
                'answer' => 'If an asset is marked as Unavailable, Under Maintenance, or Lost, it will not appear as an option for new borrowings and cannot be reserved. The asset must be returned to an Available status before it can be assigned again.',
                'category' => 'Borrowing',
                'keywords' => ['unavailable', 'missing', 'status', 'borrow', 'reserve'],
                'roles' => [UserRole::EMPLOYEE->value, UserRole::DEPARTMENT_HEAD->value, UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/assets',
                'actions' => [
                    ['label' => 'Open Assets', 'type' => 'route', 'target' => '/assets'],
                ],
                'active' => true,
            ],
            [
                'question' => 'What does each inventory classification mean?',
                'answer' => '"PPE" represents Property, Plant, and Equipment (high-value capitalized assets). "SE" stands for Semi-Expendable property (lower value but tracked). "SUPPLY" refers to consumable items and office supplies. Each follows specific accounting rules.',
                'category' => 'Inventory',
                'keywords' => ['ppe', 'se', 'supply', 'classification', 'accounting'],
                'roles' => [UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::SUPPLY_OFFICER->value, UserRole::AUDITOR->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/inventory',
                'actions' => [
                    ['label' => 'Open Inventory', 'type' => 'route', 'target' => '/inventory'],
                ],
                'active' => true,
            ],
            [
                'question' => 'What should I do if scanning a QR code does not work?',
                'answer' => 'If a QR code is damaged or unreadable, you can manually search for the asset using its serial number, name, or asset tag within the Assets or Inventory modules.',
                'category' => 'QR & Scanning',
                'keywords' => ['qr', 'scan', 'broken', 'manual', 'search', 'fail'],
                'roles' => [UserRole::EMPLOYEE->value, UserRole::PROPERTY_CUSTODIAN->value, UserRole::INVENTORY_OFFICER->value, UserRole::DEPARTMENT_HEAD->value, UserRole::AUDITOR->value, UserRole::SUPER_ADMINISTRATOR->value, UserRole::SYSTEM_ADMINISTRATOR->value],
                'destination' => '/assets',
                'actions' => [
                    ['label' => 'Search Assets', 'type' => 'route', 'target' => '/assets'],
                    ['label' => 'Search Inventory', 'type' => 'route', 'target' => '/inventory'],
                ],
                'active' => true,
            ],
        ];

        foreach ($faqs as $faqData) {
            Faq::query()->firstOrCreate(
                ['question' => $faqData['question']],
                [
                    'answer' => $faqData['answer'],
                    'category' => $faqData['category'],
                    'keywords' => $faqData['keywords'],
                    'roles' => $faqData['roles'],
                    'destination' => $faqData['destination'],
                    'actions' => $faqData['actions'],
                    'active' => $faqData['active'],
                ]
            );
        }
    }
}
