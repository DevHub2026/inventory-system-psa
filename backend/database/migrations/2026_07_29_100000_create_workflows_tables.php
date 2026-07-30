<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('module_type'); // borrow_request, borrow_extension_request, asset_issuance, asset_reissuance, clearance_processing, maintenance_request
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_archived')->default(false);
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->json('options')->nullable(); // auto_approve_no_approver, skip_disabled_levels, allow_rejection_any_level, allow_request_cancellation, allow_requester_withdrawal, require_remarks_on_rejection, require_remarks_on_approval
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('workflow_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('workflows')->cascadeOnDelete();
            $table->integer('version_number')->default(1);
            $table->json('options')->nullable();
            $table->text('change_summary')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('workflow_approval_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_version_id')->constrained('workflow_versions')->cascadeOnDelete();
            $table->integer('level_order')->default(1);
            $table->string('name');
            $table->json('roles')->nullable(); // Array of assigned role names
            $table->json('user_ids')->nullable(); // Array of assigned specific user IDs
            $table->foreignId('office_id')->nullable()->constrained('offices')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('approval_type')->default('single'); // single, any, all
            $table->boolean('is_enabled')->default(true);
            
            // Future-proofing fields for parallel execution, conditions, escalation, delegation
            $table->string('execution_type')->default('sequential'); // sequential, parallel
            $table->string('parallel_group_id')->nullable();
            $table->json('conditions')->nullable(); // E.g., {"min_value": 5000, "category_id": 3}
            $table->integer('escalation_hours')->nullable();
            $table->json('escalate_to_roles')->nullable();
            $table->json('escalate_to_user_ids')->nullable();
            $table->boolean('allow_delegation')->default(false);

            $table->timestamps();
        });

        // Request Approval History (Immutable records of request approvals)
        Schema::create('workflow_approval_histories', function (Blueprint $table) {
            $table->id();
            $table->string('request_type'); // Morph model type e.g., App\Modules\Reservation\Models\Reservation
            $table->unsignedBigInteger('request_id');
            $table->foreignId('workflow_id')->nullable()->constrained('workflows')->nullOnDelete();
            $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
            $table->foreignId('approval_level_id')->nullable()->constrained('workflow_approval_levels')->nullOnDelete();
            $table->integer('level_order')->nullable();
            $table->string('action'); // SUBMITTED, APPROVED, REJECTED, CANCELLED, WITHDRAWN, SKIPPED, AUTO_APPROVED, DELEGATED, ESCALATED
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role')->nullable();
            $table->foreignId('office_id')->nullable()->constrained('offices')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['request_type', 'request_id']);
        });

        // Workflow Audit Logs (Audit log of workflow configuration changes)
        Schema::create('workflow_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->nullable()->constrained('workflows')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // CREATE, UPDATE, DELETE, ARCHIVE, RESTORE, DUPLICATE, PUBLISH_VERSION
            $table->json('previous_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_audit_logs');
        Schema::dropIfExists('workflow_approval_histories');
        Schema::dropIfExists('workflow_approval_levels');
        Schema::dropIfExists('workflow_versions');
        Schema::dropIfExists('workflows');
    }
};
