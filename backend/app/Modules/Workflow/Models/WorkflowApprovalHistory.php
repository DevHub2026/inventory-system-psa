<?php

namespace App\Modules\Workflow\Models;

use App\Models\User;
use App\Modules\Department\Models\Department;
use App\Modules\Office\Models\Office;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowApprovalHistory extends Model
{
    protected $fillable = [
        'request_type',
        'request_id',
        'workflow_id',
        'workflow_version_id',
        'approval_level_id',
        'level_order',
        'action',
        'user_id',
        'role',
        'office_id',
        'department_id',
        'remarks',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'level_order' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    public function approvalLevel(): BelongsTo
    {
        return $this->belongsTo(WorkflowApprovalLevel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
