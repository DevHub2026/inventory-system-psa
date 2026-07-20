<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetIdentifier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'asset_id',
        'identifier_type',
        'identifier_value',
        'is_primary',
    ];

    /**
     * Get the asset that owns the identifier.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Scope a query to only include primary identifiers.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
