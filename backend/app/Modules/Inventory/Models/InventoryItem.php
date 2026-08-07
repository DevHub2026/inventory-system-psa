<?php

namespace App\Modules\Inventory\Models;

use App\Models\Supplier;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Unit\Models\Unit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use SoftDeletes;

    protected $table = 'inventory_items';

    /**
     * INVENTORY-OWNED fields.
     *
     * Fields intentionally NOT in this list (asset-owned):
     *   condition_status, property_number, asset_number, serial_number
     */
    protected $fillable = [
        'asset_id',
        'type',
        'classification',
        'item_nature',
        'classification_reason',
        'name',
        'sku',
        'description',
        'quantity',
        'unit_cost',
        'purchase_date',
        'warranty_until',
        'supplier_id',
        'unit',
        'unit_id',
        'manufacturer_id',
        'model',
        'asset_category_id',
        'office_id',
        'location_id',
        'reorder_level',
        'is_borrowable',
        // track_as_asset: visibility controller.
        // true  → item surfaces in Asset Management (has a linked, active asset).
        // false → Inventory only. The linked asset record is NOT deleted; it is
        //         hidden from Asset Management queries. Re-enabling restores it.
        'track_as_asset',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost'      => 'decimal:2',
            'is_borrowable'  => 'boolean',
            'track_as_asset' => 'boolean',
            'purchase_date'  => 'date',
            'warranty_until' => 'date',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(Manufacturer::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function assetCategory(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    /**
     * The supplier this item was procured from.
     * supplier_id is Inventory-owned procurement data.
     * The Supplier module is future-planned; this relationship
     * future-proofs the model without requiring any UI work now.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }
}
