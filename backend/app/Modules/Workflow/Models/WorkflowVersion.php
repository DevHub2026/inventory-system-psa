<?php

namespace App\Modules\Workflow\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowVersion extends Model
{
    protected $fillable = [
        'workflow_id',
        'version_number',
        'options',
        'change_summary',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'options' => 'array',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approvalLevels(): HasMany
    {
        return $this->hasMany(WorkflowApprovalLevel::class)->orderBy('level_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
