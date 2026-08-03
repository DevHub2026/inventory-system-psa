<?php

namespace App\Modules\SystemSetup\Services;

/**
 * Single source of truth for supported DOCX placeholders.
 * Only placeholders mapped to verified database fields are registered.
 */
class PlaceholderRegistry
{
    public const MISSING_VALUE_FALLBACK = 'N/A';

    /**
     * Official printable document types that use DOCX templates.
     *
     * @return list<string>
     */
    public static function officialDocumentTypes(): array
    {
        return [
            'borrow_receipt',
            'return_receipt',
            'issuance',
            'property_transfer',
            'clearance',
            'reissuance',
        ];
    }

    /**
     * @return list<array{
     *   key: string,
     *   label: string,
     *   description: string,
     *   category: string,
     *   document_types: list<string>,
     *   source: string,
     *   required: bool,
     *   aliases: list<string>,
     *   value_type: string,
     *   missing_behavior: string
     * }>
     */
    public static function definitions(): array
    {
        $allOfficial = self::officialDocumentTypes();
        $assetDocs = ['borrow_receipt', 'return_receipt', 'issuance', 'property_transfer', 'reissuance'];
        $employeeDocs = ['borrow_receipt', 'return_receipt', 'issuance', 'property_transfer', 'clearance', 'reissuance'];
        $borrowDocs = ['borrow_receipt', 'return_receipt'];
        $issuanceDocs = ['issuance', 'property_transfer'];
        $reissueDocs = ['reissuance'];

        return [
            // Asset
            self::def('asset_name', 'Asset Name', 'Official name of the asset.', 'Asset', $assetDocs, 'assets.name'),
            self::def('asset_description', 'Asset Description', 'Description of the asset.', 'Asset', $assetDocs, 'assets.description'),
            self::def('asset_code', 'Asset Code', 'Legacy alias of asset number for backward compatibility.', 'Asset', $assetDocs, 'assets.asset_number'),
            self::def('asset_number', 'Asset Number', 'Primary system asset number.', 'Asset', $assetDocs, 'assets.asset_number'),
            self::def('property_number', 'Property Number', 'Independent property number field.', 'Asset', $assetDocs, 'assets.property_number'),
            self::def('serial_number', 'Serial Number', 'Serial number from asset identifiers.', 'Asset', $assetDocs, 'asset_identifiers where type=SERIAL_NUMBER'),
            self::def('asset_category', 'Asset Category', 'Asset category name.', 'Asset', $assetDocs, 'asset_categories.name', aliases: ['category']),
            self::def('category', 'Category', 'Legacy alias for asset category.', 'Asset', $assetDocs, 'asset_categories.name', aliases: ['asset_category']),
            self::def('asset_condition', 'Asset Condition', 'Condition status of the asset.', 'Asset', $assetDocs, 'assets.condition_status', aliases: ['condition']),
            self::def('condition', 'Condition', 'Legacy alias for asset condition.', 'Asset', $assetDocs, 'assets.condition_status', aliases: ['asset_condition']),
            self::def('asset_status', 'Asset Status', 'Current asset status.', 'Asset', $assetDocs, 'assets.status'),
            self::def('purchase_date', 'Purchase Date', 'Asset purchase date.', 'Asset', $assetDocs, 'assets.purchase_date'),
            self::def('purchase_cost', 'Purchase Cost', 'Asset purchase cost.', 'Asset', $assetDocs, 'assets.purchase_cost'),
            self::def('model', 'Model', 'Asset model.', 'Asset', $assetDocs, 'assets.model'),
            self::def('manufacturer', 'Manufacturer', 'Manufacturer name.', 'Asset', $assetDocs, 'manufacturers.name', aliases: ['brand']),
            self::def('brand', 'Brand', 'Alias of manufacturer name.', 'Asset', $assetDocs, 'manufacturers.name', aliases: ['manufacturer']),

            // Employee
            self::def('employee_name', 'Employee Name', 'Full name of the employee.', 'Employee', $employeeDocs, 'users full_name'),
            self::def('employee_number', 'Employee Number', 'Employee number.', 'Employee', $employeeDocs, 'users.employee_number'),
            self::def('employee_email', 'Employee Email', 'Employee email address.', 'Employee', $employeeDocs, 'users.email'),
            self::def('department', 'Department', 'Legacy department name token.', 'Employee', $employeeDocs, 'departments.name', aliases: ['department_name']),
            self::def('department_name', 'Department Name', 'Department name.', 'Employee', $employeeDocs, 'departments.name', aliases: ['department']),
            self::def('office', 'Office', 'Legacy office name token.', 'Employee', $employeeDocs, 'offices.name', aliases: ['office_name']),
            self::def('office_name', 'Office Name', 'Office name.', 'Employee', $employeeDocs, 'offices.name', aliases: ['office']),

            // Transaction / dates
            self::def('date_issued', 'Date Issued', 'Asset issuance date.', 'Transaction', $issuanceDocs, 'assets.date_issued', aliases: ['issued_date']),
            self::def('issued_date', 'Issued Date', 'Legacy alias for date issued.', 'Transaction', $issuanceDocs, 'assets.date_issued', aliases: ['date_issued']),
            self::def('issued_by', 'Issued By', 'Name of the issuing officer.', 'Transaction', $issuanceDocs, 'users via issued_by_user_id'),
            self::def('borrow_date', 'Borrow Date', 'Date the asset was borrowed.', 'Transaction', $borrowDocs, 'borrowings.borrow_date'),
            self::def('due_date', 'Due Date', 'Borrowing due date.', 'Transaction', $borrowDocs, 'borrowings.due_date'),
            self::def('returned_date', 'Returned Date', 'Date the asset was returned.', 'Transaction', ['return_receipt'], 'borrowings.returned_at', aliases: ['return_date']),
            self::def('return_date', 'Return Date', 'Alias for returned date.', 'Transaction', ['return_receipt'], 'borrowings.returned_at', aliases: ['returned_date']),
            self::def('requested_extension', 'Requested Extension', 'Latest requested extension due date.', 'Transaction', $borrowDocs, 'borrowing_extension_requests.requested_due_date'),
            self::def('approved_extension', 'Approved Extension', 'Approved extension due date if any.', 'Transaction', $borrowDocs, 'borrowing_extension_requests (APPROVED)'),

            // Reissuance
            self::def('previous_employee', 'Previous Employee', 'Previous accountable employee.', 'Reissuance', $reissueDocs, 'asset_issuance_histories.previous_employee'),
            self::def('new_employee', 'New Employee', 'New accountable employee.', 'Reissuance', $reissueDocs, 'asset_issuance_histories.new_employee'),
            self::def('transfer_date', 'Transfer Date', 'Date of re-issuance transfer.', 'Reissuance', $reissueDocs, 'asset_issuance_histories.transfer_date'),
            self::def('reason', 'Reason', 'Reason for re-issuance.', 'Reissuance', $reissueDocs, 'asset_issuance_histories.reason'),
            self::def('approved_by', 'Approved By', 'Approving officer name.', 'Reissuance', $reissueDocs, 'resolved or default Property Custodian'),

            // System / organization
            self::def('organization_name', 'Organization Name', 'Philippine Statistics Authority.', 'System', $allOfficial, 'constant'),
            self::def('generated_date', 'Generated Date', 'Date the document was generated.', 'System', $allOfficial, 'now()', aliases: ['current_date']),
            self::def('current_date', 'Current Date', 'Legacy alias for generated date.', 'System', $allOfficial, 'now()', aliases: ['generated_date']),
            self::def('current_time', 'Current Time', 'Time the document was generated.', 'System', $allOfficial, 'now()'),
            self::def('generated_by', 'Generated By', 'User who generated the document.', 'System', $allOfficial, 'auth user full_name'),
            self::def('prepared_by', 'Prepared By', 'Preparing officer name.', 'System', $allOfficial, 'auth user or reissuance officer'),
        ];
    }

    /**
     * @return list<string>
     */
    public static function allKeys(): array
    {
        $keys = [];
        foreach (self::definitions() as $def) {
            $keys[] = $def['key'];
            foreach ($def['aliases'] as $alias) {
                $keys[] = $alias;
            }
        }

        return array_values(array_unique($keys));
    }

    public static function isSupported(string $key): bool
    {
        return in_array($key, self::allKeys(), true);
    }

    /**
     * Return placeholder definitions for API consumption.
     *
     * Accepts either a document_type string (legacy) or a usage_context key.
     * When a usage_context is supplied it is resolved to the matching document_type
     * via TemplateUsageContext, so placeholders are filtered by the underlying type.
     *
     * @return list<array<string, mixed>>
     */
    public static function forApi(?string $documentType = null): array
    {
        // Allow callers to pass a usage_context value (e.g. BORROWING_RECEIPT) directly;
        // resolve it to the underlying document_type so filtering works correctly.
        $resolvedType = $documentType;
        if ($documentType !== null) {
            $ctx = \App\Modules\SystemSetup\Enums\TemplateUsageContext::tryFrom($documentType);
            if ($ctx !== null) {
                $resolvedType = $ctx->documentType();
            }
        }

        $defs = self::definitions();

        if ($resolvedType) {
            $defs = array_values(array_filter(
                $defs,
                fn (array $d) => in_array($resolvedType, $d['document_types'], true)
            ));
        }

        return array_map(static function (array $d) {
            return [
                'key' => $d['key'],
                'token' => '{{'.$d['key'].'}}',
                'label' => $d['label'],
                'description' => $d['description'],
                'category' => $d['category'],
                'document_types' => $d['document_types'],
                'source' => $d['source'],
                'required' => $d['required'],
                'aliases' => $d['aliases'],
                'value_type' => $d['value_type'],
                'missing_behavior' => $d['missing_behavior'],
            ];
        }, $defs);
    }

    /**
     * Return only placeholders valid for the given usage_context key.
     * Delegates to forApi() via the usage_context → document_type resolution.
     *
     * @return list<array<string, mixed>>
     */
    public static function forUsageContext(string $usageContext): array
    {
        return self::forApi($usageContext);
    }

    /**
     * @param  list<string>  $documentTypes
     * @param  list<string>  $aliases
     * @return array{
     *   key: string,
     *   label: string,
     *   description: string,
     *   category: string,
     *   document_types: list<string>,
     *   source: string,
     *   required: bool,
     *   aliases: list<string>,
     *   value_type: string,
     *   missing_behavior: string
     * }
     */
    private static function def(
        string $key,
        string $label,
        string $description,
        string $category,
        array $documentTypes,
        string $source,
        bool $required = false,
        array $aliases = [],
        string $valueType = 'string',
        string $missingBehavior = self::MISSING_VALUE_FALLBACK,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'description' => $description,
            'category' => $category,
            'document_types' => $documentTypes,
            'source' => $source,
            'required' => $required,
            'aliases' => $aliases,
            'value_type' => $valueType,
            'missing_behavior' => $missingBehavior,
        ];
    }
}
