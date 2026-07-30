<?php

namespace App\Modules\Asset\Enums;

enum IssuanceType: string
{
    case INITIAL = 'initial';
    case TRANSFER = 'transfer';
}
