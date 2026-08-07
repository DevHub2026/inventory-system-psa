<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds procurement-owned fields to inventory_items.
 *
 * OWNERSHIP:
 *   purchase_date   - Inventory-owned (the date the ITEM was purchased)
 *   warranty_until  - Inventory-owned (the warranty of the ITEM)
 *   supplier_id     - Inventory-owned (future supplier reference)
 *
 * These describe the ITEM, not a physical INSTANCE. The linked Asset only
 * displays these values (read-only) and never edits them.
 *
 * Backfill:
 *   purchase_date   - copied from assets.purchase_date for linked records
 *   warranty_until  - copied from assets.warranty_until for linked records
 *
 * The assets columns are intentionally NOT dropped in this migration -
 * they are deprecated and will be removed in a later migration after
 * verification that the frontend/backend no longer use them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->date('purchase_date')
                ->nullable()
                ->after('unit_cost')
                ->comment('Item purchase date. Inventory-owned procurement field.');
            $table->date('warranty_until')
                ->nullable()
                ->after('purchase_date')
                ->comment('Item warranty expiration. Inventory-owned procurement field.');
            $table->foreignId('supplier_id')
                ->nullable()
                ->after('warranty_until')
                ->comment('Future supplier reference. Inventory-owned procurement field.');
        });

        // Backfill from linked assets (PostgreSQL-compatible syntax)
        DB::statement("
            UPDATE inventory_items
            SET
                purchase_date  = COALESCE(inventory_items.purchase_date,  a.purchase_date),
                warranty_until = COALESCE(inventory_items.warranty_until, a.warranty_until)
            FROM assets AS a
            WHERE inventory_items.asset_id = a.id
              AND inventory_items.asset_id IS NOT NULL
              AND inventory_items.deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('supplier_id');
            $table->dropColumn(['purchase_date', 'warranty_until']);
        });
    }
};