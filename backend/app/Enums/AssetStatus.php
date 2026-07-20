<?php

namespace App\Enums;

enum AssetStatus: string
{
    case AVAILABLE = 'available';
    case RESERVED = 'reserved';
    case BORROWED = 'borrowed';
    case MAINTENANCE = 'maintenance';
    case UNAVAILABLE = 'unavailable';
    case RETIRED = 'retired';
    case DISPOSED = 'disposed';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
