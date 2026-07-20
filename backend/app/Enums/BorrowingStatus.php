<?php

namespace App\Enums;

enum BorrowingStatus: string
{
    case ACTIVE = 'active';
    case PARTIALLY_RETURNED = 'partially_returned';
    case RETURNED = 'returned';
    case OVERDUE = 'overdue';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
