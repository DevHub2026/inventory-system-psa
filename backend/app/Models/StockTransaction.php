<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inventory_item_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'user_id',
        'reason',
        'remarks',
    ];

    /**
     * Get the inventory item that owns the transaction.
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if transaction is stock in.
     */
    public function isStockIn(): bool
    {
        return $this->type === 'stock_in';
    }

    /**
     * Check if transaction is stock out.
     */
    public function isStockOut(): bool
    {
        return $this->type === 'stock_out';
    }

    /**
     * Check if transaction is adjustment.
     */
    public function isAdjustment(): bool
    {
        return $this->type === 'adjustment';
    }
}
