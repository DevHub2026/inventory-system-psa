<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (! Schema::hasColumn('assets', 'issued_to_user_id')) {
                $table->foreignId('issued_to_user_id')->nullable()->after('issued_to')->constrained('users')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['issued_to_user_id']);
            $table->dropColumn('issued_to_user_id');
        });
    }
};
