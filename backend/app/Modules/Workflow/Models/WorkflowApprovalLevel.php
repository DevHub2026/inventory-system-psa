<?php

namespace App\Modules\Workflow\Models;

use App\Modules\Department\Models\Department;
use App\Models\Office;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowApprovalLevel extends Model
{
    protected $fillable = [
        'workflow_version_id',
        'level_order',
        'name',
        'roles',
        'user_ids',
        'office_id',
        'department_id',
        'approval_type',
        'is_enabled',
        'execution_type',
        'parallel_group_id',
        'conditions',
        'escalation_hours',
        'escalate_to_roles',
        'escalate_to_user_ids',
        'allow_delegation',
    ];

    protected function casts(): array
    {
        return [
            'level_order' => 'integer',
            'roles' => 'array',
            'user_ids' => 'array',
            'is_enabled' => 'boolean',
            'conditions' => 'array',
            'escalation_hours' => 'integer',
            'escalate_to_roles' => 'array',
            'escalate_to_user_ids' => 'array',
            'allow_delegation' => 'boolean',
        ];
    }

    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
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
