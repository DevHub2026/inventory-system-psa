<?php

namespace App\Modules\Asset\Models;

use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_number',
        'name',
        'description',
        'asset_category_id',
        'manufacturer_id',
        'office_id',
        'location_id',
        'model',
        'status',
        'condition_status',
        'purchase_date',
        'purchase_cost',
        'warranty_until',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssetStatus::class,
            'condition_status' => ConditionStatus::class,
            'purchase_date' => 'date',
            'warranty_until' => 'date',
            'purchase_cost' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
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

    public function identifiers(): HasMany
    {
        return $this->hasMany(AssetIdentifier::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', AssetStatus::AVAILABLE);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if ($term === null || $term === '') {
            return $query;
        }

        $like = '%'.$term.'%';
        $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        return $query->where(function (Builder $builder) use ($like, $operator) {
            $builder
                ->where('asset_number', $operator, $like)
                ->orWhere('name', $operator, $like)
                ->orWhere('model', $operator, $like)
                ->orWhereHas('identifiers', function (Builder $identifiers) use ($like, $operator) {
                    $identifiers->where('identifier_value', $operator, $like);
                });
        });
    }
}
