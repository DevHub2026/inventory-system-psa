<?php

namespace App\Modules\SystemSetup\Enums;

/**
 * Stable context keys that identify which system workflow a document template
 * is intended for.
 *
 * These values are derived exclusively from verified document-generation
 * workflows present in DocumentDataResolver and DocumentExportService.
 * Do NOT add a value here unless the backend can actually resolve and
 * generate the corresponding document.
 *
 * Mapping to document_type:
 *   BORROWING_RECEIPT    → borrow_receipt
 *   BORROWING_RETURN     → return_receipt
 *   PERMANENT_ISSUANCE   → issuance
 *   ASSET_TRANSFER       → property_transfer
 *   ASSET_REISSUANCE     → reissuance
 *   CLEARANCE            → clearance
 */
enum TemplateUsageContext: string
{
    case BORROWING_RECEIPT  = 'BORROWING_RECEIPT';
    case BORROWING_RETURN   = 'BORROWING_RETURN';
    case PERMANENT_ISSUANCE = 'PERMANENT_ISSUANCE';
    case ASSET_TRANSFER     = 'ASSET_TRANSFER';
    case ASSET_REISSUANCE   = 'ASSET_REISSUANCE';
    case CLEARANCE          = 'CLEARANCE';

    /** Human-readable label shown in the UI. */
    public function label(): string
    {
        return match ($this) {
            self::BORROWING_RECEIPT  => 'Borrowing Receipt',
            self::BORROWING_RETURN   => 'Borrowing Return Receipt',
            self::PERMANENT_ISSUANCE => 'Permanent Asset Issuance',
            self::ASSET_TRANSFER     => 'Asset Transfer / Property Transfer',
            self::ASSET_REISSUANCE   => 'Asset Re-Issuance',
            self::CLEARANCE          => 'Employee Clearance',
        };
    }

    /**
     * Operational status of this context.
     *
     * FULLY_CONNECTED     — backend resolver + API endpoint + verified frontend trigger all exist.
     * BACKEND_SUPPORTED   — backend resolver and API endpoint exist but no verified frontend
     *                       page/button currently triggers this context.
     */
    public function operationalStatus(): string
    {
        return match ($this) {
            self::BORROWING_RECEIPT  => 'FULLY_CONNECTED',
            self::BORROWING_RETURN   => 'FULLY_CONNECTED',
            self::PERMANENT_ISSUANCE => 'FULLY_CONNECTED',
            self::ASSET_REISSUANCE   => 'FULLY_CONNECTED',
            self::ASSET_TRANSFER     => 'BACKEND_SUPPORTED',
            self::CLEARANCE          => 'BACKEND_SUPPORTED',
        };
    }

    /** Human-readable note about operational status. */
    public function operationalNote(): string
    {
        return match ($this) {
            self::BORROWING_RECEIPT,
            self::BORROWING_RETURN,
            self::PERMANENT_ISSUANCE,
            self::ASSET_REISSUANCE   => 'Fully connected — backend and frontend workflow verified.',
            self::ASSET_TRANSFER     => 'Backend supported. The document data resolver and API endpoint are implemented, but no dedicated frontend page currently triggers this document type.',
            self::CLEARANCE          => 'Backend supported. The document data resolver and API endpoint are implemented, but no dedicated frontend clearance page currently triggers this document type.',
        };
    }

    /** Short description for UI help text. */
    public function description(): string
    {
        return match ($this) {
            self::BORROWING_RECEIPT  => 'Printed when an asset is borrowed.',
            self::BORROWING_RETURN   => 'Printed when a borrowed asset is returned.',
            self::PERMANENT_ISSUANCE => 'Used for permanent issuance / PAR documents.',
            self::ASSET_TRANSFER     => 'Used when property is transferred between employees.',
            self::ASSET_REISSUANCE   => 'Used when an asset is re-issued to a new employee.',
            self::CLEARANCE          => 'Used during employee clearance processing.',
        };
    }

    /**
     * The primary document_type value this context maps to.
     * Used as fallback when resolving by document_type.
     */
    public function documentType(): string
    {
        return match ($this) {
            self::BORROWING_RECEIPT  => 'borrow_receipt',
            self::BORROWING_RETURN   => 'return_receipt',
            self::PERMANENT_ISSUANCE => 'issuance',
            self::ASSET_TRANSFER     => 'property_transfer',
            self::ASSET_REISSUANCE   => 'reissuance',
            self::CLEARANCE          => 'clearance',
        };
    }

    /**
     * Find the usage context that maps to the given document_type value.
     * Returns null when no context covers that document type (e.g. report types).
     */
    public static function fromDocumentType(string $documentType): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->documentType() === $documentType) {
                return $case;
            }
        }

        return null;
    }

    /** All contexts as a flat array suitable for API responses. */
    public static function all(): array
    {
        return array_map(
            fn (self $ctx) => [
                'value'              => $ctx->value,
                'label'              => $ctx->label(),
                'description'        => $ctx->description(),
                'document_type'      => $ctx->documentType(),
                'operational_status' => $ctx->operationalStatus(),
                'operational_note'   => $ctx->operationalNote(),
            ],
            self::cases(),
        );
    }
}
