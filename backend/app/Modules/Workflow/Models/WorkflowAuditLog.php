<?php

namespace App\Modules\Workflow\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'workflow_id',
        'user_id',
        'action',
        'previous_value',
        'new_value',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'previous_value' => 'array',
            'new_value' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
