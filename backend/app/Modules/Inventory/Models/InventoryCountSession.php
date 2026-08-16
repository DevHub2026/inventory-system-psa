<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use App\Modules\Asset\Models\Location;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryCountSession extends Model
{
    protected $fillable = [
        'location_id',
        'started_by',
        'completed_by',
        'reconciled_by',
        'status',
        'counted_at',
        'completed_at',
        'reconciled_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'counted_at' => 'datetime',
            'completed_at' => 'datetime',
            'reconciled_at' => 'datetime',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryCountItem::class);
    }

    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }
}
