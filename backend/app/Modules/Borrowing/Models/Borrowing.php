<?php

namespace App\Modules\Borrowing\Models;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Borrowing extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'asset_id',
        'reservation_id',
        'borrow_date',
        'borrowed_at',
        'due_date',
        'status',
        'remarks',
        'authorized_by',
        'authorized_at',
        'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'borrow_date' => 'date',
            'borrowed_at' => 'datetime',
            'due_date' => 'date',
            'authorized_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function authorizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Reservation\Models\Reservation::class);
    }
}
