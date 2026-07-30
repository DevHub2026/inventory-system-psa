<?php

namespace App\Modules\Report\Services;

use App\Models\User;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Support\Facades\Auth;

/**
 * Resolves verified placeholder values for official DOCX documents.
 */
class DocumentDataResolver
{
    /**
     * @return array<string, string>
     */
    public function resolve(string $documentType, int $targetId): array
    {
        $fallback = PlaceholderRegistry::MISSING_VALUE_FALLBACK;
        $authUser = Auth::user();

        $placeholders = [
            'organization_name' => 'PHILIPPINE STATISTICS AUTHORITY',
            'generated_date' => now()->format('F j, Y'),
            'current_date' => now()->format('F j, Y'),
            'current_time' => now()->format('g:i A'),
            'generated_by' => $this->val($authUser?->full_name, $fallback),
            'prepared_by' => $this->val($authUser?->full_name, 'Property Custodian'),
        ];

        return match ($documentType) {
            'borrow_receipt', 'return_receipt' => array_merge(
                $placeholders,
                $this->fromBorrowing($targetId, $documentType, $fallback)
            ),
            'issuance', 'property_transfer' => array_merge(
                $placeholders,
                $this->fromIssuanceAsset($targetId, $fallback)
            ),
            'clearance' => array_merge(
                $placeholders,
                $this->fromClearanceUser($targetId, $fallback)
            ),
            'reissuance' => array_merge(
                $placeholders,
                $this->fromReissuance($targetId, $fallback)
            ),
            default => throw new \InvalidArgumentException('Unsupported document type for DOCX generation: '.$documentType),
        };
    }

    public function targetTypeFor(string $documentType): string
    {
        return match ($documentType) {
            'borrow_receipt', 'return_receipt' => 'borrowing',
            'issuance', 'property_transfer' => 'asset',
            'clearance' => 'user',
            'reissuance' => 'asset_issuance_history',
            default => 'unknown',
        };
    }

    /**
     * @return array<string, string>
     */
    private function fromBorrowing(int $targetId, string $documentType, string $fallback): array
    {
        $borrowing = Borrowing::with([
            'user.department',
            'user.office',
            'asset.category',
            'asset.office',
            'asset.manufacturer',
            'asset.identifiers',
            'extensionRequests' => fn ($q) => $q->latest()->limit(1),
        ])->findOrFail($targetId);

        $user = $borrowing->user;
        $asset = $borrowing->asset;
        $latestExtension = $borrowing->extensionRequests->first();
        $assetFields = $this->assetFields($asset, $fallback);

        $data = array_merge($assetFields, [
            'employee_name' => $this->val($user?->full_name ?? $user?->email, $fallback),
            'employee_number' => $this->val($user?->employee_number, $fallback),
            'employee_email' => $this->val($user?->email, $fallback),
            'department' => $this->val($user?->department?->name, $fallback),
            'department_name' => $this->val($user?->department?->name, $fallback),
            'office' => $this->val($asset?->office?->name ?? $user?->office?->name, 'PSA Regional Office'),
            'office_name' => $this->val($asset?->office?->name ?? $user?->office?->name, 'PSA Regional Office'),
            'borrow_date' => $borrowing->borrow_date?->format('F j, Y') ?? $fallback,
            'due_date' => $borrowing->due_date?->format('F j, Y') ?? $fallback,
            'returned_date' => $borrowing->returned_at?->format('F j, Y') ?? ($documentType === 'return_receipt' ? now()->format('F j, Y') : $fallback),
            'return_date' => $borrowing->returned_at?->format('F j, Y') ?? ($documentType === 'return_receipt' ? now()->format('F j, Y') : $fallback),
            'requested_extension' => $latestExtension?->requested_due_date?->format('F j, Y') ?? $fallback,
            'approved_extension' => ($latestExtension?->status?->value === 'APPROVED')
                ? ($latestExtension?->requested_due_date?->format('F j, Y') ?? $fallback)
                : $fallback,
        ]);

        return $data;
    }

    /**
     * @return array<string, string>
     */
    private function fromIssuanceAsset(int $targetId, string $fallback): array
    {
        $asset = Asset::with([
            'category',
            'office',
            'location',
            'manufacturer',
            'identifiers',
            'issuedByUser.department',
            'issuedByUser.office',
            'issuedToUser.department',
            'issuedToUser.office',
        ])->findOrFail($targetId);

        $issuedTo = $asset->issuedToUser;
        $issuedBy = $asset->issuedByUser;
        $assetFields = $this->assetFields($asset, $fallback);

        $employeeName = $issuedTo?->full_name
            ?? $asset->issued_to
            ?? 'Accountable Employee';

        $department = $issuedTo?->department?->name
            ?? $issuedBy?->department?->name
            ?? $asset->office?->name
            ?? $fallback;

        return array_merge($assetFields, [
            'employee_name' => $this->val($employeeName, $fallback),
            'employee_number' => $this->val($issuedTo?->employee_number ?? $issuedBy?->employee_number, $fallback),
            'employee_email' => $this->val($issuedTo?->email ?? $issuedBy?->email, $fallback),
            'department' => $this->val($department, $fallback),
            'department_name' => $this->val($department, $fallback),
            'office' => $this->val($asset->office?->name, 'PSA Central Office'),
            'office_name' => $this->val($asset->office?->name, 'PSA Central Office'),
            'date_issued' => $asset->date_issued?->format('F j, Y') ?? now()->format('F j, Y'),
            'issued_date' => $asset->date_issued?->format('F j, Y') ?? now()->format('F j, Y'),
            'issued_by' => $this->val($issuedBy?->full_name, $fallback),
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function fromClearanceUser(int $targetId, string $fallback): array
    {
        $user = User::with(['department', 'office'])->findOrFail($targetId);

        return [
            'employee_name' => $this->val($user->full_name, $fallback),
            'employee_number' => $this->val($user->employee_number, $fallback),
            'employee_email' => $this->val($user->email, $fallback),
            'department' => $this->val($user->department?->name, $fallback),
            'department_name' => $this->val($user->department?->name, $fallback),
            'office' => $this->val($user->office?->name, 'Philippine Statistics Authority'),
            'office_name' => $this->val($user->office?->name, 'Philippine Statistics Authority'),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function fromReissuance(int $targetId, string $fallback): array
    {
        $history = \App\Modules\Asset\Models\AssetIssuanceHistory::with([
            'asset.office',
            'asset.category',
            'asset.manufacturer',
            'asset.identifiers',
            'previousEmployee.department',
            'previousEmployee.office',
            'newEmployee.department',
            'newEmployee.office',
            'officer',
        ])->findOrFail($targetId);

        $asset = $history->asset;
        $prev = $history->previousEmployee;
        $new = $history->newEmployee;
        $officer = $history->officer;
        $assetFields = $this->assetFields($asset, $fallback);

        return array_merge($assetFields, [
            'previous_employee' => $this->val($prev?->full_name ?? $asset?->issued_to, $fallback),
            'new_employee' => $this->val($new?->full_name, $fallback),
            'employee_name' => $this->val($new?->full_name, $fallback),
            'employee_number' => $this->val($new?->employee_number, $fallback),
            'employee_email' => $this->val($new?->email, $fallback),
            'department' => $this->val($new?->department?->name, $fallback),
            'department_name' => $this->val($new?->department?->name, $fallback),
            'office' => $this->val($asset?->office?->name, $fallback),
            'office_name' => $this->val($asset?->office?->name, $fallback),
            'transfer_date' => $history->transfer_date?->format('F j, Y') ?? $fallback,
            'reason' => $this->val($history->reason, $fallback),
            'prepared_by' => $this->val($officer?->full_name, $fallback),
            'approved_by' => 'Property Custodian',
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function assetFields(?Asset $asset, string $fallback): array
    {
        if (! $asset) {
            return [
                'asset_name' => $fallback,
                'asset_description' => $fallback,
                'asset_code' => $fallback,
                'property_number' => $fallback,
                'serial_number' => $fallback,
                'asset_category' => $fallback,
                'category' => $fallback,
                'asset_condition' => $fallback,
                'condition' => $fallback,
                'asset_status' => $fallback,
                'purchase_date' => $fallback,
                'purchase_cost' => $fallback,
                'model' => $fallback,
                'manufacturer' => $fallback,
                'brand' => $fallback,
            ];
        }

        $serial = $this->identifierValue($asset, IdentifierType::SERIAL_NUMBER);
        $propertyFromIdentifier = $this->identifierValue($asset, IdentifierType::PROPERTY_NUMBER);
        $propertyNumber = $propertyFromIdentifier ?: $asset->asset_number;

        $condition = $asset->condition_status instanceof \BackedEnum
            ? $asset->condition_status->value
            : ($asset->condition_status ?? null);

        $status = $asset->status instanceof \BackedEnum
            ? $asset->status->value
            : ($asset->status ?? null);

        $manufacturer = $asset->manufacturer?->name;

        return [
            'asset_name' => $this->val($asset->name, $fallback),
            'asset_description' => $this->val($asset->description, $fallback),
            'asset_code' => $this->val($asset->asset_number, $fallback),
            'property_number' => $this->val($propertyNumber, $fallback),
            'serial_number' => $this->val($serial, $fallback),
            'asset_category' => $this->val($asset->category?->name, $fallback),
            'category' => $this->val($asset->category?->name, $fallback),
            'asset_condition' => $this->val($condition, 'Good'),
            'condition' => $this->val($condition, 'Good'),
            'asset_status' => $this->val($status, $fallback),
            'purchase_date' => $asset->purchase_date?->format('F j, Y') ?? $fallback,
            'purchase_cost' => $asset->purchase_cost !== null ? (string) $asset->purchase_cost : $fallback,
            'model' => $this->val($asset->model, $fallback),
            'manufacturer' => $this->val($manufacturer, $fallback),
            'brand' => $this->val($manufacturer, $fallback),
        ];
    }

    private function identifierValue(Asset $asset, IdentifierType $type): ?string
    {
        $identifiers = $asset->relationLoaded('identifiers')
            ? $asset->identifiers
            : $asset->identifiers()->get();

        $match = $identifiers->first(function ($identifier) use ($type) {
            $identifierType = $identifier->identifier_type;

            return $identifierType === $type
                || ($identifierType instanceof IdentifierType && $identifierType === $type)
                || (is_string($identifierType) && $identifierType === $type->value);
        });

        return $match?->identifier_value;
    }

    private function val(mixed $value, string $fallback): string
    {
        if ($value === null) {
            return $fallback;
        }

        $string = trim((string) $value);

        return $string === '' ? $fallback : $string;
    }
}
