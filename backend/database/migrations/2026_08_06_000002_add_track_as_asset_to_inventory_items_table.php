<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds track_as_asset to inventory_items.
 *
 * PURPOSE
 * ───────
 * Controls whether an Inventory Item surfaces inside Asset Management.
 *
 *   track_as_asset = true  → Item appears in both Inventory and Assets
 *   track_as_asset = false → Item appears in Inventory only
 *                            (the linked Asset record is NOT deleted; it is
 *                             simply hidden from Asset Management queries.
 *                             Re-enabling restores the same Asset record.)
 *
 * RELATIONSHIP TO is_borrowable
 * ─────────────────────────────
 *   track_as_asset = false does NOT affect borrowing, transfer, maintenance,
 *   disposal or audit.  It is purely a visibility flag.
 *   is_borrowable controls borrowing workflow entry only.
 *
 * BACKFILL LOGIC
 * ──────────────
 *   true  — items that have an asset_id AND are not SUPPLY (they are actively
 *            tracked as an accountable physical asset)
 *   false — SUPPLY items (consumable, never individually tracked) and any
 *            item without an asset_id (shouldn't exist after the link migration,
 *            but safe to default false)
 *
 * DEPRECATION NOTE
 * ────────────────
 *   The transient in-memory `track_as_asset` flag in InventoryService
 *   normalizeClassificationData() is replaced by this persisted column.
 *   The service now reads/writes from this column instead of discarding
 *   the value after use.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->boolean('track_as_asset')
                ->default(false)
                ->after('is_borrowable')
                ->comment(
                    'Visibility controller. true = item surfaces in Asset Management. '.
                    'false = Inventory only. Never deletes the linked asset record.'
                );

            $table->index('track_as_asset', 'inv_items_track_as_asset_idx');
        });

        // ── Backfill ─────────────────────────────────────────────────────────
        // Items with a linked asset AND not classified as SUPPLY → actively tracked.
        // Everything else → inventory-only (false).
        DB::statement("
            UPDATE inventory_items
            SET track_as_asset = true
            WHERE asset_id IS NOT NULL
              AND (classification IS NULL OR classification != 'SUPPLY')
              AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->dropIndex('inv_items_track_as_asset_idx');
            $table->dropColumn('track_as_asset');
        });
    }
};
