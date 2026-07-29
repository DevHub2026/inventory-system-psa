<?php

namespace App\Modules\Borrowing\Models;

use App\Models\User;
use App\Modules\Borrowing\Enums\ExtensionRequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BorrowExtensionRequest extends Model
{
    protected $fillable = [
        'borrowing_id',
        'current_due_date',
        'requested_due_date',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'remarks',
        'workflow_version_id',
        'current_level_order',
        'workflow_status',
    ];

    protected function casts(): array
    {
        return [
            'current_due_date' => 'date',
            'requested_due_date' => 'date',
            'reviewed_at' => 'datetime',
            'status' => ExtensionRequestStatus::class,
        ];
    }

    public function borrowing(): BelongsTo
    {
        return $this->belongsTo(Borrowing::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', ExtensionRequestStatus::PENDING);
    }

    public function scopeForBorrowing($query, int $borrowingId)
    {
        return $query->where('borrowing_id', $borrowingId);
    }
}