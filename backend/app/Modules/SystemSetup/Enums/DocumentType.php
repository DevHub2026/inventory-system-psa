<?php

namespace App\Modules\SystemSetup\Enums;

enum DocumentType: string
{
    // Reports
    case INVENTORY_REPORT = 'inventory_report';
    case ASSET_REPORT = 'asset_report';
    case BORROW_REPORT = 'borrow_report';
    case RESERVATION_REPORT = 'reservation_report';
    case MAINTENANCE_REPORT = 'maintenance_report';

    // Receipts
    case BORROW_RECEIPT = 'borrow_receipt';
    case RETURN_RECEIPT = 'return_receipt';

    // Documents
    case CLEARANCE = 'clearance';
    case ISSUANCE = 'issuance';
    case PROPERTY_TRANSFER = 'property_transfer';
    case REISSUANCE = 'reissuance';

    // Exports
    case EXCEL_EXPORT = 'excel_export';
    case CSV_EXPORT = 'csv_export';

    // Future
    case PDF_TEMPLATE = 'pdf_template';

    /**
     * Human-readable label for the document type.
     */
    public function label(): string
    {
        return match ($this) {
            self::INVENTORY_REPORT     => 'Inventory Report',
            self::ASSET_REPORT         => 'Asset Report',
            self::BORROW_REPORT        => 'Borrow Report',
            self::RESERVATION_REPORT   => 'Reservation Report',
            self::MAINTENANCE_REPORT   => 'Maintenance Report',
            self::BORROW_RECEIPT       => 'Borrow Receipt',
            self::RETURN_RECEIPT       => 'Return Receipt',
            self::CLEARANCE            => 'Clearance',
            self::ISSUANCE             => 'Issuance',
            self::PROPERTY_TRANSFER    => 'Property Transfer',
            self::REISSUANCE           => 'Asset Re-Issuance Form',
            self::EXCEL_EXPORT         => 'Excel Export',
            self::CSV_EXPORT           => 'CSV Export',
            self::PDF_TEMPLATE         => 'PDF Template',
        };
    }

    /**
     * Category grouping for UI display.
     */
    public function category(): string
    {
        return match ($this) {
            self::INVENTORY_REPORT, self::ASSET_REPORT,
            self::BORROW_REPORT, self::RESERVATION_REPORT,
            self::MAINTENANCE_REPORT => 'Reports',

            self::BORROW_RECEIPT, self::RETURN_RECEIPT => 'Receipts',

            self::CLEARANCE, self::ISSUANCE, self::PROPERTY_TRANSFER, self::REISSUANCE => 'Documents',

            self::EXCEL_EXPORT, self::CSV_EXPORT, self::PDF_TEMPLATE => 'Exports',
        };
    }

    /**
     * All supported file extensions for this document type.
     */
    public function allowedExtensions(): array
    {
        return match ($this) {
            self::EXCEL_EXPORT => ['xlsx', 'xls'],
            self::CSV_EXPORT   => ['csv'],
            self::PDF_TEMPLATE => ['pdf'],
            default            => ['xlsx', 'xls', 'csv', 'docx', 'pdf'],
        };
    }

    /**
     * Get all document types as an array of [value, label, category].
     */
    public static function all(): array
    {
        return array_map(
            fn (self $type) => [
                'value'    => $type->value,
                'label'    => $type->label(),
                'category' => $type->category(),
            ],
            self::cases(),
        );
    }
}
