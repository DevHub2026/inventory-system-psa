<?php

namespace App\Modules\Workflow\Enums;

enum WorkflowModuleType: string
{
    case BORROW_REQUEST = 'borrow_request';
    case BORROW_EXTENSION = 'borrow_extension_request';
    case ASSET_ISSUANCE = 'asset_issuance';
    case ASSET_REISSUANCE = 'asset_reissuance';
    case CLEARANCE_PROCESSING = 'clearance_processing';
    case MAINTENANCE_REQUEST = 'maintenance_request';

    public function label(): string
    {
        return match ($this) {
            self::BORROW_REQUEST => 'Borrow Request',
            self::BORROW_EXTENSION => 'Borrow Extension Request',
            self::ASSET_ISSUANCE => 'Asset Issuance',
            self::ASSET_REISSUANCE => 'Asset Re-Issuance',
            self::CLEARANCE_PROCESSING => 'Clearance Processing',
            self::MAINTENANCE_REQUEST => 'Maintenance Request',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
