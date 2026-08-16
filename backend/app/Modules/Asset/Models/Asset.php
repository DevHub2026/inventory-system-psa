<?php

namespace App\Modules\Asset\Models;

use App\Models\Borrow;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Resolve the factory for this model.
     * The factory lives at Database\Factories\AssetFactory (legacy location).
     */
    protected static function newFactory(): \Database\Factories\AssetFactory
    {
        return \Database\Factories\AssetFactory::new();
    }

    protected $fillable = [
        'asset_number',
        'property_number',
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
        'insurance_provider',
        'insurance_policy_number',
        'insurance_expiration_date',
        'remarks',
        'issued_to',
        'issued_to_user_id',
        'issued_by_user_id',
        'date_issued',
        // Disposal lifecycle fields
        'disposal_reason',
        'disposal_date',
        'disposal_method',
        'disposal_approval_ref',
        'disposal_approved_by',
        'disposal_cancelled_at',
        'disposal_cancel_reason',
        'custodian_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssetStatus::class,
            'condition_status' => ConditionStatus::class,
            'purchase_date' => 'date',
            'warranty_until' => 'date',
            'insurance_expiration_date' => 'date',
            'date_issued' => 'date',
            'disposal_date' => 'date',
            'disposal_cancelled_at' => 'datetime',
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

    public function issuedByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'issued_by_user_id');
    }

    public function issuedToUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'issued_to_user_id');
    }

    public function issuanceHistories(): HasMany
    {
        return $this->hasMany(AssetIssuanceHistory::class, 'asset_id');
    }

    public function identifiers(): HasMany
    {
        return $this->hasMany(AssetIdentifier::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AssetAttachment::class);
    }

    public function borrows(): HasMany
    {
        return $this->hasMany(\App\Modules\Borrowing\Models\Borrowing::class);
    }

    /**
     * The linked InventoryItem that owns this asset record.
     * inventory_items.asset_id → assets.id (inverse of BelongsTo on InventoryItem).
     */
    public function inventoryItem(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Modules\Inventory\Models\InventoryItem::class, 'asset_id');
    }

    /** User who approved / initiated the disposal workflow. */
    public function disposalApprover(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'disposal_approved_by');
    }

    /**
     * Current custodian (person responsible for the physical asset instance).
     */
    public function custodian(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'custodian_id');
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
                ->orWhere('property_number', $operator, $like)
                ->orWhere('name', $operator, $like)
                ->orWhere('model', $operator, $like)
                ->orWhereHas('identifiers', function (Builder $identifiers) use ($like, $operator) {
                    $identifiers->where('identifier_value', $operator, $like);
                });
        });
    }
}
