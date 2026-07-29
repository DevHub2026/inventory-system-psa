<?php

namespace App\Modules\Workflow\Enums;

enum WorkflowAction: string
{
    case SUBMITTED = 'SUBMITTED';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case CANCELLED = 'CANCELLED';
    case WITHDRAWN = 'WITHDRAWN';
    case SKIPPED = 'SKIPPED';
    case AUTO_APPROVED = 'AUTO_APPROVED';
    case DELEGATED = 'DELEGATED';
    case ESCALATED = 'ESCALATED';

    public function label(): string
    {
        return match ($this) {
            self::SUBMITTED => 'Submitted',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::CANCELLED => 'Cancelled',
            self::WITHDRAWN => 'Withdrawn',
            self::SKIPPED => 'Skipped',
            self::AUTO_APPROVED => 'Auto Approved',
            self::DELEGATED => 'Delegated',
            self::ESCALATED => 'Escalated',
        };
    }
}
