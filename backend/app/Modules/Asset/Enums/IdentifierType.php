<?php

namespace App\Modules\Asset\Enums;

enum IdentifierType: string
{
    case PSA_QR = 'PSA_QR';
    case MANUFACTURER_QR = 'MANUFACTURER_QR';
    case MANUFACTURER_BARCODE = 'MANUFACTURER_BARCODE';
    case PROPERTY_TAG = 'PROPERTY_TAG';
    case QR_CODE = 'QR_CODE';
    case BARCODE = 'BARCODE';
    case SERIAL_NUMBER = 'SERIAL_NUMBER';
    case PROPERTY_NUMBER = 'PROPERTY_NUMBER';
    case ASSET_TAG = 'ASSET_TAG';
}
