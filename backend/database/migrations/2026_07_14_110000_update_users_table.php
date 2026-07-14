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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('employee_number')->unique()->after('id');
            $table->string('first_name')->after('email');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->after('middle_name');
            $table->foreignId('department_id')->nullable()->after('last_name');
            $table->string('status')->default('active')->after('department_id');
            $table->softDeletes();
            
            $table->index('employee_number');
            $table->index('department_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['status']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['employee_number']);
            $table->dropColumn(['status', 'department_id', 'last_name', 'middle_name', 'first_name', 'employee_number']);
            $table->string('name')->after('id');
        });
    }
};
