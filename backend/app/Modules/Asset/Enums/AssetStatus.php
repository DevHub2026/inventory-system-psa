<?php

namespace App\Modules\Asset\Enums;

enum AssetStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case RESERVED = 'RESERVED';
    case BORROWED = 'BORROWED';
    case MAINTENANCE = 'MAINTENANCE';
    case UNAVAILABLE = 'UNAVAILABLE';
    case RETIRED = 'RETIRED';
    case DISPOSED = 'DISPOSED';

    public function isBorrowable(): bool
    {
        return $this === self::AVAILABLE;
    }

    public function isReservable(): bool
    {
        return $this === self::AVAILABLE;
    }
}
