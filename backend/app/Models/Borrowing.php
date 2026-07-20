<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Borrowing extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'purpose',
        'borrowed_at',
        'due_at',
        'status',
        'approved_by',
        'approved_at',
        'received_by',
        'returned_at',
        'returned_by',
        'remarks',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the user that owns the borrowing.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who approved the borrowing.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who received the borrowing.
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Get the user who returned the borrowing.
     */
    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    /**
     * Get the items for the borrowing.
     */
    public function items(): HasMany
    {
        return $this->hasMany(BorrowingItem::class);
    }

    /**
     * Check if borrowing is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if borrowing is partially returned.
     */
    public function isPartiallyReturned(): bool
    {
        return $this->status === 'partially_returned';
    }

    /**
     * Check if borrowing is returned.
     */
    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    /**
     * Check if borrowing is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    /**
     * Check if borrowing is past due date.
     */
    public function isPastDue(): bool
    {
        return $this->due_at < now() && !$this->isReturned();
    }
}
