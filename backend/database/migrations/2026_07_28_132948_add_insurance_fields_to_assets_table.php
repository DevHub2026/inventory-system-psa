<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (!Schema::hasColumn('assets', 'insurance_provider')) {
                $table->string('insurance_provider')->nullable()->after('warranty_until');
            }
            if (!Schema::hasColumn('assets', 'insurance_policy_number')) {
                $table->string('insurance_policy_number')->nullable()->after('insurance_provider');
            }
            if (!Schema::hasColumn('assets', 'insurance_expiration_date')) {
                $table->date('insurance_expiration_date')->nullable()->after('insurance_policy_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['insurance_provider', 'insurance_policy_number', 'insurance_expiration_date']);
        });
    }
};
