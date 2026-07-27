<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryCustomField extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'field_key',
        'field_type',
        'options',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'options' => 'array',
        'is_active' => 'boolean',
    ];

    public function inventoryItems(): BelongsToMany
    {
        return $this->belongsToMany(InventoryItem::class, 'inventory_item_custom_fields')
            ->withPivot('value')
            ->withTimestamps();
    }
}