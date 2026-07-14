<?php

namespace App\Modules\Asset\Enums;

enum IdentifierType: string
{
    case QR_CODE = 'QR_CODE';
    case BARCODE = 'BARCODE';
    case SERIAL_NUMBER = 'SERIAL_NUMBER';
    case PROPERTY_NUMBER = 'PROPERTY_NUMBER';
    case ASSET_TAG = 'ASSET_TAG';
}
