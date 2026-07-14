<?php

namespace App\Modules\AssetIdentifier\Models;

use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetIdentifier extends Model
{
    protected $fillable = [
        'asset_id',
        'identifier_type',
        'identifier_value',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'identifier_type' => IdentifierType::class,
            'is_primary' => 'boolean',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
