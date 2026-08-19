<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->longText('answer');
            $table->string('category')->default('General');
            $table->json('keywords')->nullable();
            $table->json('roles')->nullable();
            $table->string('destination')->nullable();
            $table->json('actions')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::table('faqs')->insert([
            [
                'question' => 'How do I find an asset in the system?',
                'answer' => 'Open Assets or Inventory, use the search field, and narrow the list with the available filters. Select the asset to open its detail view and review the current assignment, location, status, and related operational record.',
                'category' => 'Assets',
                'keywords' => json_encode(['asset', 'search', 'inventory', 'details', 'location', 'status']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer']),
                'destination' => '/assets',
                'actions' => json_encode([
                    ['label' => 'Open Assets', 'type' => 'route', 'target' => '/assets'],
                    ['label' => 'Open Inventory', 'type' => 'route', 'target' => '/inventory'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I search and filter inventory?',
                'answer' => 'Open Inventory and use the search box together with the filter controls to narrow the list by relevant criteria. The page keeps the current search, sort order, and export actions aligned with the active filters so the displayed results match the selection you made.',
                'category' => 'Inventory',
                'keywords' => json_encode(['inventory', 'search', 'filter', 'status', 'location', 'category', 'sort', 'export']),
                'roles' => json_encode(['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer']),
                'destination' => '/inventory',
                'actions' => json_encode([
                    ['label' => 'Open Inventory', 'type' => 'route', 'target' => '/inventory'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I borrow an item?',
                'answer' => 'Open Borrowings and follow the supported borrowing flow for the asset or request you need. If the item has a QR code attached, you can also open the QR Scanner and scan the physical asset code to identify it before continuing the verified borrowing steps. Complete any required approval or issue action available to your role before the item is issued.',
                'category' => 'Borrowing',
                'keywords' => json_encode(['borrow', 'borrowing', 'asset', 'qr', 'issue']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head']),
                'destination' => '/borrowings',
                'actions' => json_encode([
                    ['label' => 'Open Borrowings', 'type' => 'route', 'target' => '/borrowings'],
                    ['label' => 'Open QR Scanner', 'type' => 'route', 'target' => '/qr'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I return a borrowed item?',
                'answer' => 'Open Borrowings, select the active borrowing, and use the return action available for your role. Completing the return updates the borrowing record and the asset status so the item is no longer treated as issued or currently checked out.',
                'category' => 'Borrowing',
                'keywords' => json_encode(['return', 'borrowings', 'due date', 'issued', 'complete return']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head']),
                'destination' => '/borrowings',
                'actions' => json_encode([
                    ['label' => 'Open Borrowings', 'type' => 'route', 'target' => '/borrowings'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I use the QR scanner?',
                'answer' => 'Open QR Scanner and point it at the PSA QR code attached to the asset or related record. The scanner identifies the item and opens the supported asset-detail workflow so you can continue the next verified action without manually searching for the record.',
                'category' => 'QR',
                'keywords' => json_encode(['qr', 'scanner', 'asset', 'camera', 'scan']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor']),
                'destination' => '/qr',
                'actions' => json_encode([
                    ['label' => 'Open QR Scanner', 'type' => 'route', 'target' => '/qr'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I manage reservations?',
                'answer' => 'Open Reservations to view current reservation records, create a new request if your role allows it, and follow the workflow for the relevant asset or availability check. The list updates with the current state of each reservation so you can see what is pending or already processed.',
                'category' => 'Reservations',
                'keywords' => json_encode(['reservation', 'reserve', 'booking', 'availability', 'schedule']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head']),
                'destination' => '/reservations',
                'actions' => json_encode([
                    ['label' => 'Open Reservations', 'type' => 'route', 'target' => '/reservations'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I request an extension to a due date?',
                'answer' => 'Open Extension Requests to review the existing borrowing record and submit a due-date extension request if the workflow is available to your role. Approvers can then review the request and decide whether to approve or reject it before the updated due date is applied.',
                'category' => 'Extension Requests',
                'keywords' => json_encode(['extension', 'extensions', 'due date', 'due-date', 'approval', 'borrow extension']),
                'roles' => json_encode(['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head']),
                'destination' => '/extension-requests',
                'actions' => json_encode([
                    ['label' => 'Open Extension Requests', 'type' => 'route', 'target' => '/extension-requests'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I manage system setup?',
                'answer' => 'Open System Setup to review the configuration records used across the application, including departments, offices, locations, manufacturers, categories, and related reference data. Only the roles with system administration responsibilities should use this page to maintain those records.',
                'category' => 'System Setup',
                'keywords' => json_encode(['system setup', 'setup', 'department', 'office', 'location', 'manufacturer', 'category', 'configuration']),
                'roles' => json_encode(['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer']),
                'destination' => '/system-setup',
                'actions' => json_encode([
                    ['label' => 'Open System Setup', 'type' => 'route', 'target' => '/system-setup'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I view reports?',
                'answer' => 'Open Reports to review the operational summaries and historical views available to your role. This page is the main place to inspect reporting data for inventory, borrowing, and related activity across the application.',
                'category' => 'Reports',
                'keywords' => json_encode(['report', 'reports', 'history', 'summary', 'analytics', 'overview']),
                'roles' => json_encode(['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer']),
                'destination' => '/reports',
                'actions' => json_encode([
                    ['label' => 'Open Reports', 'type' => 'route', 'target' => '/reports'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I manage users and roles?',
                'answer' => 'Open Users or Roles if your role includes administrative access. These pages are used for user administration and role-based access management, while day-to-day operational tasks remain governed by the application’s existing permissions and workflows.',
                'category' => 'Users',
                'keywords' => json_encode(['users', 'roles', 'administration', 'access', 'permissions']),
                'roles' => json_encode(['Super Administrator', 'System Administrator']),
                'destination' => '/users',
                'actions' => json_encode([
                    ['label' => 'Open Users', 'type' => 'route', 'target' => '/users'],
                    ['label' => 'Open Roles', 'type' => 'route', 'target' => '/roles'],
                ]),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
