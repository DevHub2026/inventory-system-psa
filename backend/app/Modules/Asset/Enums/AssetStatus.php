<?php

namespace App\Modules\Asset\Enums;

enum AssetStatus: string
{
    case AVAILABLE    = 'AVAILABLE';
    case RESERVED     = 'RESERVED';
    case BORROWED     = 'BORROWED';
    case MAINTENANCE  = 'MAINTENANCE';
    case UNAVAILABLE  = 'UNAVAILABLE';
    case FOR_DISPOSAL = 'FOR_DISPOSAL';
    case RETIRED      = 'RETIRED';
    case DISPOSED     = 'DISPOSED';

    public function isBorrowable(): bool
    {
        return $this === self::AVAILABLE;
    }

    public function isReservable(): bool
    {
        return $this === self::AVAILABLE;
    }

    /**
     * Returns true when the asset is permanently out of operational use.
     * FOR_DISPOSAL and DISPOSED are both ineligible for borrowing, reservation,
     * issuance, or re-issuance.
     */
    public function isOperationallyInactive(): bool
    {
        return $this === self::FOR_DISPOSAL || $this === self::DISPOSED || $this === self::RETIRED;
    }

    /**
     * Valid manual status transitions (from → allowed next values).
     * Workflow-owned statuses (BORROWED, RESERVED) are excluded here; they
     * are managed exclusively by the borrowing/reservation services.
     */
    public static function allowedManualTransitionsFrom(self $current): array
    {
        return match ($current) {
            self::AVAILABLE    => [self::MAINTENANCE, self::UNAVAILABLE, self::FOR_DISPOSAL, self::RETIRED, self::DISPOSED],
            self::MAINTENANCE  => [self::AVAILABLE, self::UNAVAILABLE, self::FOR_DISPOSAL, self::RETIRED, self::DISPOSED],
            self::UNAVAILABLE  => [self::AVAILABLE, self::MAINTENANCE, self::FOR_DISPOSAL, self::RETIRED, self::DISPOSED],
            self::FOR_DISPOSAL => [self::AVAILABLE, self::DISPOSED],   // reversal allowed; can be finalised
            self::RESERVED     => [],   // workflow-owned
            self::BORROWED     => [],   // workflow-owned
            self::RETIRED      => [self::DISPOSED],
            self::DISPOSED     => [],   // terminal
        };
    }
}
