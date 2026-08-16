<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCountItem extends Model
{
    protected $fillable = [
        'inventory_count_session_id',
        'inventory_item_id',
        'expected_quantity',
        'actual_quantity',
        'variance',
        'remarks',
        'counted_at',
        'counted_by',
        'reconciliation_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'integer',
            'actual_quantity' => 'integer',
            'variance' => 'integer',
            'counted_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(InventoryCountSession::class, 'inventory_count_session_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function countedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function reconciliationTransaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class, 'reconciliation_transaction_id');
    }
}
