<?php

namespace App\Modules\Maintenance\Models;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Maintenance extends Model
{
    use SoftDeletes;

    protected $table = 'maintenances';

    protected $fillable = [
        'asset_id',
        'user_id',
        'reported_by',
        'type',
        'severity',
        'status',
        'scheduled_date',
        'completed_date',
        'description',
        'notes',
        'cost',
        'workflow_version_id',
        'current_level_order',
        'workflow_status',
    ];

    protected $casts = [
        'scheduled_date'  => 'date',
        'completed_date'  => 'date',
        'cost'            => 'decimal:2',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reportedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
