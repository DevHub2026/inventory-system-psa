<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
        'inventory_category_id',
        'unit_id',
        'supplier_id',
        'quantity',
        'minimum_quantity',
        'maximum_quantity',
        'status',
        'unit_cost',
        'description',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Get the category that owns the inventory item.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'inventory_category_id');
    }

    /**
     * Get the unit that owns the inventory item.
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the supplier that owns the inventory item.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the stock transactions for the inventory item.
     */
    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    /**
     * Check if inventory item is in stock.
     */
    public function isInStock(): bool
    {
        return $this->status === 'in_stock';
    }

    /**
     * Check if inventory item is low stock.
     */
    public function isLowStock(): bool
    {
        return $this->status === 'low_stock';
    }

    /**
     * Check if inventory item is out of stock.
     */
    public function isOutOfStock(): bool
    {
        return $this->status === 'out_of_stock';
    }

    /**
     * Check if quantity is below minimum.
     */
    public function isBelowMinimum(): bool
    {
        return $this->quantity <= $this->minimum_quantity;
    }

    /**
     * Check if quantity is above maximum.
     */
    public function isAboveMaximum(): bool
    {
        return $this->maximum_quantity && $this->quantity >= $this->maximum_quantity;
    }
}
