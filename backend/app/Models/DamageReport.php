<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamageReport extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'asset_id',
        'user_id',
        'borrowing_item_id',
        'damage_type',
        'description',
        'severity',
        'reported_at',
        'resolved_at',
        'resolved_by',
        'resolution',
        'remarks',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the asset that owns the damage report.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the user that owns the damage report.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the borrowing item that owns the damage report.
     */
    public function borrowingItem(): BelongsTo
    {
        return $this->belongsTo(BorrowingItem::class);
    }

    /**
     * Get the user who resolved the damage report.
     */
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Check if damage report is resolved.
     */
    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

    /**
     * Check if damage is minor.
     */
    public function isMinor(): bool
    {
        return $this->severity === 'minor';
    }

    /**
     * Check if damage is moderate.
     */
    public function isModerate(): bool
    {
        return $this->severity === 'moderate';
    }

    /**
     * Check if damage is severe.
     */
    public function isSevere(): bool
    {
        return $this->severity === 'severe';
    }
}
