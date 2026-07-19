<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('inventory_items', 'asset_id')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->foreignId('asset_id')->nullable()->after('id')->constrained('assets')->nullOnDelete();
            });
        }

        $now = now();

        $categoryId = DB::table('asset_categories')->where('code', 'INV')->value('id');
        if (! $categoryId) {
            $categoryId = DB::table('asset_categories')->insertGetId([
                'name' => 'Inventory Item',
                'code' => 'INV',
                'description' => 'Automatically linked records created from inventory items.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $officeId = DB::table('offices')->where('code', 'MAIN')->value('id');
        if (! $officeId) {
            $officeId = DB::table('offices')->insertGetId([
                'name' => 'Main Office',
                'code' => 'MAIN',
                'description' => 'Default office for migrated inventory assets.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('inventory_items')
            ->whereNull('asset_id')
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get()
            ->each(function ($item) use ($categoryId, $officeId, $now) {
                $baseAssetNumber = $item->sku ?: 'INV-'.$item->id;
                $assetNumber = $baseAssetNumber;
                $suffix = 1;

                while (DB::table('assets')->where('asset_number', $assetNumber)->exists()) {
                    $assetNumber = $baseAssetNumber.'-'.$suffix;
                    $suffix++;
                }

                $assetId = DB::table('assets')->insertGetId([
                    'asset_number' => $assetNumber,
                    'name' => $item->name,
                    'description' => 'Linked from inventory item #'.$item->id.'.',
                    'asset_category_id' => $categoryId,
                    'manufacturer_id' => null,
                    'office_id' => $officeId,
                    'location_id' => null,
                    'model' => null,
                    'status' => $item->quantity > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
                    'condition_status' => 'GOOD',
                    'purchase_date' => null,
                    'purchase_cost' => null,
                    'warranty_until' => null,
                    'remarks' => $item->remarks,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('inventory_items')
                    ->where('id', $item->id)
                    ->update([
                        'asset_id' => $assetId,
                        'updated_at' => $now,
                    ]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('inventory_items', 'asset_id')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropConstrainedForeignId('asset_id');
            });
        }
    }
};
