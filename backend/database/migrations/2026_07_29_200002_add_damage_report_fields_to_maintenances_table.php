<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            if (! Schema::hasColumn('maintenances', 'reported_by')) {
                $table->foreignId('reported_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('maintenances', 'severity')) {
                $table->string('severity')->nullable()->after('type'); // low, medium, high, critical
            }
            if (! Schema::hasColumn('maintenances', 'workflow_version_id')) {
                $table->foreignId('workflow_version_id')->nullable()->after('notes')->constrained('workflow_versions')->nullOnDelete();
            }
            if (! Schema::hasColumn('maintenances', 'current_level_order')) {
                $table->unsignedTinyInteger('current_level_order')->nullable()->after('workflow_version_id');
            }
            if (! Schema::hasColumn('maintenances', 'workflow_status')) {
                $table->string('workflow_status')->nullable()->after('current_level_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('maintenances', 'reported_by')) {
                $table->dropConstrainedForeignId('reported_by');
            }
            if (Schema::hasColumn('maintenances', 'severity')) {
                $columnsToDrop[] = 'severity';
            }
            if (Schema::hasColumn('maintenances', 'workflow_status')) {
                $columnsToDrop[] = 'workflow_status';
            }
            if (Schema::hasColumn('maintenances', 'current_level_order')) {
                $columnsToDrop[] = 'current_level_order';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
