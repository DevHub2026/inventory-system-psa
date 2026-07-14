<?php

namespace App\Modules\Asset\Enums;

enum ConditionStatus: string
{
    case GOOD = 'GOOD';
    case FAIR = 'FAIR';
    case DAMAGED = 'DAMAGED';
    case LOST = 'LOST';
    case UNDER_REPAIR = 'UNDER_REPAIR';
}
