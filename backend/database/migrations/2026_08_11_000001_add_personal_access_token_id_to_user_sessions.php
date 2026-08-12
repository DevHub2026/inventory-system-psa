<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('user_sessions', 'personal_access_token_id')) {
                $table->unsignedBigInteger('personal_access_token_id')->nullable()->after('login_at')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('user_sessions', 'personal_access_token_id')) {
                $table->dropColumn('personal_access_token_id');
            }
        });
    }
};
