<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table): void {
            $table->string('property_number')->nullable()->after('asset_number');
            $table->unique('property_number');
            $table->index('property_number');
        });

        DB::table('assets')
            ->select('assets.id', 'asset_identifiers.identifier_value')
            ->join('asset_identifiers', 'asset_identifiers.asset_id', '=', 'assets.id')
            ->where('asset_identifiers.identifier_type', 'PROPERTY_NUMBER')
            ->whereNull('assets.property_number')
            ->orderBy('assets.id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('assets')
                        ->where('id', $row->id)
                        ->update(['property_number' => $row->identifier_value]);
                }
            }, 'assets.id');
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table): void {
            $table->dropUnique(['property_number']);
            $table->dropIndex(['property_number']);
            $table->dropColumn('property_number');
        });
    }
};
