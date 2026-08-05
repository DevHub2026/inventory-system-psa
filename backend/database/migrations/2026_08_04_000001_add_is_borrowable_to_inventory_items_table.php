<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds is_borrowable to inventory_items.
 *
 * Business rules:
 *  - PPE / SE items default to TRUE (they can be borrowed by default).
 *  - SUPPLY items default to FALSE (consumables are not borrowable by default).
 *  - The flag must be enforced by the backend; the frontend may not bypass it.
 *
 * Existing records are backfilled:
 *  - classification = 'SUPPLY'  → is_borrowable = false
 *  - classification = 'PPE'|'SE' or null → is_borrowable = true
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->boolean('is_borrowable')
                ->default(true)
                ->after('reorder_level')
                ->comment('Whether this item can appear in borrowing workflows. Supply items default to false.');
        });

        // Backfill: supply items are not borrowable by default.
        DB::table('inventory_items')
            ->where('classification', 'SUPPLY')
            ->update(['is_borrowable' => false]);
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->dropColumn('is_borrowable');
        });
    }
};
