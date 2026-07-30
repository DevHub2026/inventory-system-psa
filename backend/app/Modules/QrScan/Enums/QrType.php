<?php

namespace App\Modules\QrScan\Enums;

enum QrType: string
{
    case ASSET = 'ASSET';
    case BORROWING_RECEIPT = 'BORROWING_RECEIPT';
    case RETURN_RECEIPT = 'RETURN_RECEIPT';
    case UNKNOWN = 'UNKNOWN';
}