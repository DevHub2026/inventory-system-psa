<?php

namespace App\Enums;

enum InventoryStatus: string
{
    case IN_STOCK = 'in_stock';
    case LOW_STOCK = 'low_stock';
    case OUT_OF_STOCK = 'out_of_stock';
    case DISCONTINUED = 'discontinued';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
