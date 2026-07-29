<?php

namespace App\Modules\Workflow\Enums;

enum ApprovalType: string
{
    case SINGLE = 'single';
    case ANY = 'any';
    case ALL = 'all';

    public function label(): string
    {
        return match ($this) {
            self::SINGLE => 'Single Approver',
            self::ANY => 'Any Approver',
            self::ALL => 'All Approvers',
        };
    }
}
