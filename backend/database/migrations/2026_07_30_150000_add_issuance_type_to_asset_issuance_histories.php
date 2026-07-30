<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_issuance_histories', function (Blueprint $table) {
            $table->string('issuance_type', 20)->nullable()->after('asset_id');
        });

        DB::table('asset_issuance_histories')
            ->whereNull('issuance_type')
            ->update(['issuance_type' => 'transfer']);
    }

    public function down(): void
    {
        Schema::table('asset_issuance_histories', function (Blueprint $table) {
            $table->dropColumn('issuance_type');
        });
    }
};
