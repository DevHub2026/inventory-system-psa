<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('qr_scan_histories', function (Blueprint $table) {
            if (! Schema::hasColumn('qr_scan_histories', 'scan_source')) {
                $table->string('scan_source')->nullable()->default('sidebar_scanner')->after('browser');
            }
        });
    }

    public function down(): void
    {
        Schema::table('qr_scan_histories', function (Blueprint $table) {
            if (Schema::hasColumn('qr_scan_histories', 'scan_source')) {
                $table->dropColumn('scan_source');
            }
        });
    }
};
