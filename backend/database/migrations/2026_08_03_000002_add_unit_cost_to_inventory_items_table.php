<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds unit_cost to inventory_items.
 *
 * This is the single source-of-truth price field for accountable
 * inventory items. It is used to automatically determine PPE/SE classification:
 *   - unit_cost >= 50000  → PPE
 *   - unit_cost >  0 and < 50000 → SE
 *   - unit_cost is null/zero     → classification left as-is (manual review)
 *
 * Supply items (classification = SUPPLY) may store a cost here for
 * procurement/stock-valuation purposes but it does NOT trigger PPE/SE logic.
 *
 * Existing records are left with null unit_cost so no automatic
 * reclassification occurs for legacy data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->decimal('unit_cost', 15, 2)->nullable()->after('quantity')
                ->comment('Item unit price in PHP. Drives PPE/SE auto-classification for accountable items.');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('unit_cost');
        });
    }
};
