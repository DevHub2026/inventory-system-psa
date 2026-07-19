<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('assets')
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($asset) use ($now) {
                $exists = DB::table('asset_identifiers')
                    ->where('asset_id', $asset->id)
                    ->where('identifier_type', 'PSA_QR')
                    ->exists();

                if ($exists) {
                    return;
                }

                DB::table('asset_identifiers')->insert([
                    'asset_id' => $asset->id,
                    'identifier_type' => 'PSA_QR',
                    'identifier_value' => 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT),
                    'is_primary' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        DB::table('asset_identifiers')
            ->where('identifier_type', 'PSA_QR')
            ->delete();
    }
};
