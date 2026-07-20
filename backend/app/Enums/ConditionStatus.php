<?php

namespace App\Enums;

enum ConditionStatus: string
{
    case GOOD = 'good';
    case FAIR = 'fair';
    case DAMAGED = 'damaged';
    case LOST = 'lost';
    case UNDER_REPAIR = 'under_repair';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
