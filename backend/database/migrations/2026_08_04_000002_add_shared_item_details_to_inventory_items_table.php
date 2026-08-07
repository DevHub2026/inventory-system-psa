<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds inventory-owned shared item detail columns to inventory_items.
 *
 * OWNERSHIP:
 *   model             — Inventory-owned (e.g. "ThinkPad X1 Carbon")
 *   description       — Inventory-owned item description
 *   asset_category_id — Inventory-owned category (FK → asset_categories)
 *
 * These columns are NOT on the assets table — they are the authoritative
 * source on inventory_items and are pushed to the linked asset only at
 * initial creation.  Subsequent edits via Inventory update only
 * inventory_items; InventoryService.syncLinkedAsset() does NOT push them
 * back to assets so the asset owner can change them independently.
 *
 * Backfill:
 *   - model: copied from assets.model for linked records
 *   - description: copied from assets.description for linked records
 *   - asset_category_id: copied from assets.asset_category_id for linked records
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->string('model', 255)->nullable()->after('manufacturer_id')
                ->comment('Shared model/product number — e.g. ThinkPad X1 Carbon. Inventory-owned.');
            $table->text('description')->nullable()->after('model')
                ->comment('Item description. Inventory-owned.');
            $table->foreignId('asset_category_id')->nullable()->after('description')
                ->constrained('asset_categories')
                ->nullOnDelete()
                ->comment('Asset category. Inventory-owned. Used as initial value for linked asset at creation.');
        });

        // ── Backfill from linked asset (PostgreSQL-compatible syntax) ────────
        DB::statement("
            UPDATE inventory_items
            SET
                model             = COALESCE(inventory_items.model,             a.model),
                description       = COALESCE(inventory_items.description,       a.description),
                asset_category_id = COALESCE(inventory_items.asset_category_id, a.asset_category_id)
            FROM assets AS a
            WHERE inventory_items.asset_id = a.id
              AND inventory_items.asset_id IS NOT NULL
              AND inventory_items.deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->dropForeign(['asset_category_id']);
            $table->dropColumn(['model', 'description', 'asset_category_id']);
        });
    }
};
