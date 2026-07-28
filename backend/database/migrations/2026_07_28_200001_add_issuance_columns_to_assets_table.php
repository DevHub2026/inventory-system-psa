<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (! Schema::hasColumn('assets', 'issued_to')) {
                $table->string('issued_to')->nullable()->after('remarks');
            }
            if (! Schema::hasColumn('assets', 'issued_by_user_id')) {
                $table->unsignedBigInteger('issued_by_user_id')->nullable()->after('issued_to');
                $table->foreign('issued_by_user_id')->references('id')->on('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('assets', 'date_issued')) {
                $table->date('date_issued')->nullable()->after('issued_by_user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['issued_by_user_id']);
            $table->dropColumn(['issued_to', 'issued_by_user_id', 'date_issued']);
        });
    }
};
