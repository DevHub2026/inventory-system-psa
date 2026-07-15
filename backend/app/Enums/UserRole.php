<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMINISTRATOR = 'Super Administrator';
    case SYSTEM_ADMINISTRATOR = 'System Administrator';
    case PROPERTY_CUSTODIAN = 'Property Custodian';
    case INVENTORY_OFFICER = 'Inventory Officer';
    case DEPARTMENT_HEAD = 'Department Head';
    case EMPLOYEE = 'Employee';
    case AUDITOR = 'Auditor';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
