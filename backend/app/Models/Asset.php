<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'asset_number',
        'name',
        'description',
        'asset_category_id',
        'manufacturer_id',
        'office_id',
        'location_id',
        'model',
        'serial_number',
        'purchase_date',
        'purchase_cost',
        'status',
        'condition',
        'remarks',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Get the category that owns the asset.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    /**
     * Get the manufacturer that owns the asset.
     */
    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(Manufacturer::class);
    }

    /**
     * Get the office that owns the asset.
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * Get the location that owns the asset.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the identifiers for the asset.
     */
    public function identifiers(): HasMany
    {
        return $this->hasMany(AssetIdentifier::class);
    }

    /**
     * Get the reservation items for the asset.
     */
    public function reservationItems(): HasMany
    {
        return $this->hasMany(ReservationItem::class);
    }

    /**
     * Get the borrowing items for the asset.
     */
    public function borrowingItems(): HasMany
    {
        return $this->hasMany(BorrowingItem::class);
    }

    /**
     * Get the maintenance requests for the asset.
     */
    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    /**
     * Get the damage reports for the asset.
     */
    public function damageReports(): HasMany
    {
        return $this->hasMany(DamageReport::class);
    }

    /**
     * Check if asset is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if asset is borrowed.
     */
    public function isBorrowed(): bool
    {
        return $this->status === 'borrowed';
    }

    /**
     * Check if asset is reserved.
     */
    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }
}
