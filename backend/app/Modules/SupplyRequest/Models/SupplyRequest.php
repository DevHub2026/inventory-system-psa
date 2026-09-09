<?php

namespace App\Modules\SupplyRequest\Models;

use App\Models\Office;
use App\Models\User;
use App\Modules\Workflow\Models\WorkflowVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplyRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'office_id',
        'status',
        'workflow_version_id',
        'current_level_order',
        'workflow_status',
        'remarks',
        'fulfilled_by',
        'fulfilled_at',
    ];

    protected function casts(): array
    {
        return [
            'fulfilled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    public function fulfiller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplyRequestItem::class);
    }
}
