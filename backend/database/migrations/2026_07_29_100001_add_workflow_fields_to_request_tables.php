<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
            $table->integer('current_level_order')->nullable()->default(1);
            $table->string('workflow_status')->nullable()->default('PENDING_APPROVAL'); // PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
        });

        Schema::table('borrow_extension_requests', function (Blueprint $table) {
            $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
            $table->integer('current_level_order')->nullable()->default(1);
            $table->string('workflow_status')->nullable()->default('PENDING_APPROVAL');
        });

        if (Schema::hasTable('maintenances')) {
            Schema::table('maintenances', function (Blueprint $table) {
                $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
                $table->integer('current_level_order')->nullable()->default(1);
                $table->string('workflow_status')->nullable()->default('PENDING_APPROVAL');
            });
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['workflow_version_id']);
            $table->dropColumn(['workflow_version_id', 'current_level_order', 'workflow_status']);
        });

        Schema::table('borrow_extension_requests', function (Blueprint $table) {
            $table->dropForeign(['workflow_version_id']);
            $table->dropColumn(['workflow_version_id', 'current_level_order', 'workflow_status']);
        });

        if (Schema::hasTable('maintenances')) {
            Schema::table('maintenances', function (Blueprint $table) {
                $table->dropForeign(['workflow_version_id']);
                $table->dropColumn(['workflow_version_id', 'current_level_order', 'workflow_status']);
            });
        }
    }
};
