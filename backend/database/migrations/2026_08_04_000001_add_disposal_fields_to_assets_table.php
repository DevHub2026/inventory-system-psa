<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add disposal lifecycle fields to the assets table.
     *
     * These fields support the FOR_DISPOSAL -> DISPOSED workflow and the
     * authorized reversal path (FOR_DISPOSAL -> AVAILABLE). No existing
     * asset history, borrowings, issuances, or audit logs are modified
     * by adding these nullable columns.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->text('disposal_reason')->nullable()->after('remarks');
            $table->date('disposal_date')->nullable()->after('disposal_reason');
            $table->string('disposal_method', 100)->nullable()->after('disposal_date');
            $table->string('disposal_approval_ref', 255)->nullable()->after('disposal_method');
            $table->foreignId('disposal_approved_by')->nullable()->constrained('users')->nullOnDelete()->after('disposal_approval_ref');
            $table->timestamp('disposal_cancelled_at')->nullable()->after('disposal_approved_by');
            $table->text('disposal_cancel_reason')->nullable()->after('disposal_cancelled_at');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('disposal_approved_by');
            $table->dropColumn([
                'disposal_reason',
                'disposal_date',
                'disposal_method',
                'disposal_approval_ref',
                'disposal_cancelled_at',
                'disposal_cancel_reason',
            ]);
        });
    }
};