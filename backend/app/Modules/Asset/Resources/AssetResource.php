<?php

namespace App\Modules\Asset\Resources;

use App\Modules\AssetCategory\Resources\AssetCategoryResource;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\AssetIdentifier\Resources\AssetIdentifierResource;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Attach lightweight reservation context only when the asset is RESERVED.
        // This tells the frontend WHY the asset is reserved without requiring an
        // extra API call. We only read the single most-relevant reservation.
        $reservationContext = null;
        $statusValue = $this->status instanceof AssetStatus
            ? $this->status->value
            : (string) $this->status;

        if ($statusValue === AssetStatus::RESERVED->value) {
            // Prefer an APPROVED reservation (awaiting release) over a PENDING one.
            $reservation = Reservation::query()
                ->whereIn('status', ['APPROVED', 'PENDING'])
                ->whereHas('assets', fn ($q) => $q
                    ->where('assets.id', $this->id)
                    ->whereNull('reservation_items.fulfilled_at'))
                ->orderByRaw("CASE WHEN status = 'APPROVED' THEN 0 ELSE 1 END")
                ->orderBy('created_at')
                ->first();

            if ($reservation) {
                $reservationContext = [
                    'id'                => $reservation->id,
                    'status'            => $reservation->status,
                    'workflow_status'   => $reservation->workflow_status,
                    'requester_name'    => $reservation->user?->full_name ?? $reservation->user?->email,
                    'authorized_by_name' => $reservation->authorizer?->full_name ?? $reservation->authorizer?->email,
                    'authorized_at'     => $reservation->authorized_at?->format('Y-m-d H:i:s'),
                ];
            }
        }

        return [
            'id' => $this->id,
            'asset_number' => $this->asset_number,
            'property_number' => $this->property_number,
            'name' => $this->name,
            'description' => $this->description,
            'asset_category_id' => $this->asset_category_id,
            'manufacturer_id' => $this->manufacturer_id,
            'office_id' => $this->office_id,
            'location_id' => $this->location_id,
            'model' => $this->model,
            'status' => $this->status,
            'condition_status' => $this->condition_status,
            'purchase_date' => $this->purchase_date,
            'purchase_cost' => $this->purchase_cost,
            'warranty_until' => $this->warranty_until,
            'remarks' => $this->remarks,
            'issued_to' => $this->issued_to,
            'issued_to_user_id' => $this->issued_to_user_id,
            'issued_by_user_id' => $this->issued_by_user_id,
            'date_issued' => $this->date_issued?->format('Y-m-d'),
            'issued_by_name' => $this->issued_by_user_id ? optional($this->issuedByUser)->full_name : null,
            'issued_to_user' => $this->when(
                $this->issued_to_user_id && $this->relationLoaded('issuedToUser'),
                fn () => [
                    'id' => $this->issuedToUser?->id,
                    'full_name' => $this->issuedToUser?->full_name,
                    'employee_number' => $this->issuedToUser?->employee_number,
                    'email' => $this->issuedToUser?->email,
                    'department' => $this->issuedToUser?->department?->name,
                    'office' => $this->issuedToUser?->office?->name,
                    'roles' => $this->issuedToUser?->roles?->pluck('name')->values(),
                ],
            ),
            'is_unlinked_holder' => $this->issued_to_user_id === null && filled($this->issued_to),
            'disposal_reason' => $this->disposal_reason,
            'disposal_date' => $this->disposal_date?->format('Y-m-d'),
            'disposal_method' => $this->disposal_method,
            'disposal_approval_ref' => $this->disposal_approval_ref,
            'disposal_approved_by' => $this->disposal_approved_by,
            'disposal_approved_by_name' => $this->disposal_approved_by ? optional(\App\Models\User::find($this->disposal_approved_by))->full_name : null,
            'disposal_marked_at' => in_array($this->status, [AssetStatus::FOR_DISPOSAL, AssetStatus::DISPOSED], true)
                ? $this->updated_at?->format('Y-m-d H:i:s')
                : null,
            'disposal_cancelled_at' => $this->disposal_cancelled_at?->format('Y-m-d H:i:s'),
            'disposal_cancel_reason' => $this->disposal_cancel_reason,
            'psa_qr_identifier' => $this->relationLoaded('identifiers')
                ? ($this->identifiers->firstWhere('identifier_type', IdentifierType::PSA_QR->value)?->identifier_value)
                : null,
            'psa_qr_payload'    => $this->relationLoaded('identifiers')
                ? ($this->identifiers->firstWhere('identifier_type', IdentifierType::PSA_QR->value)?->identifier_value)
                : null,
            'category' => AssetCategoryResource::make($this->whenLoaded('category')),
            'manufacturer' => ManufacturerResource::make($this->whenLoaded('manufacturer')),
            'office' => OfficeResource::make($this->whenLoaded('office')),
            'location' => LocationResource::make($this->whenLoaded('location')),
            'identifiers' => AssetIdentifierResource::collection($this->whenLoaded('identifiers')),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_by_name' => $this->created_by ? optional(\App\Models\User::find($this->created_by))->full_name : null,
            'updated_by_name' => $this->updated_by ? optional(\App\Models\User::find($this->updated_by))->full_name : null,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'deleted_at' => $this->deleted_at,
            // Inline reservation context — only present when status = RESERVED.
            // null when asset is not reserved.
            'reservation_context' => $reservationContext,

            // ── Inventory linkage ────────────────────────────────────────────
            // Top-level shorthands kept for backward compatibility so existing
            // frontend code continues to work.  inventoryItem is always eager-loaded
            // from AssetService methods, so these fallback queries rarely execute.
            'inventory_item_id' => $this->relationLoaded('inventoryItem')
                ? $this->inventoryItem?->id
                : \App\Modules\Inventory\Models\InventoryItem::query()->where('asset_id', $this->id)->value('id'),
            'is_borrowable' => $this->relationLoaded('inventoryItem')
                ? (bool) ($this->inventoryItem?->is_borrowable ?? true)
                : (bool) (\App\Modules\Inventory\Models\InventoryItem::query()->where('asset_id', $this->id)->value('is_borrowable') ?? true),

            // ── Nested inventory block ───────────────────────────────────────
            // All Inventory-owned fields the frontend needs for read-only display
            // in Asset Edit / View Asset.  Only present when inventoryItem is loaded.
            // null when there is no linked item.  The `procurement` sub-key groups
            // cost/date fields so the frontend can render a clean "Procurement
            // Information" read-only panel without mixing them with asset fields.
            'inventory' => $this->when(
                $this->relationLoaded('inventoryItem') && $this->inventoryItem !== null,
                fn () => [
                    'id'               => $this->inventoryItem->id,
                    'name'             => $this->inventoryItem->name,
                    'sku'              => $this->inventoryItem->sku,
                    'description'      => $this->inventoryItem->description,
                    'classification'   => $this->inventoryItem->classification,
                    'type'             => $this->inventoryItem->type,
                    'model'            => $this->inventoryItem->model,
                    'manufacturer_id'  => $this->inventoryItem->manufacturer_id,
                    'manufacturer'     => $this->inventoryItem->relationLoaded('manufacturer')
                        ? $this->inventoryItem->manufacturer?->name
                        : null,
                    'asset_category_id' => $this->inventoryItem->asset_category_id,
                    'is_borrowable'    => (bool) ($this->inventoryItem->is_borrowable ?? true),
                    'track_as_asset'   => (bool) ($this->inventoryItem->track_as_asset ?? false),
                    // Procurement — Inventory is the single source of truth.
                    // Asset Edit shows these read-only; editing happens in Inventory only.
                    'procurement' => [
                        'unit_cost'      => $this->inventoryItem->unit_cost !== null
                            ? (float) $this->inventoryItem->unit_cost
                            : null,
                        'purchase_date'  => $this->inventoryItem->purchase_date?->format('Y-m-d'),
                        'warranty_until' => $this->inventoryItem->warranty_until?->format('Y-m-d'),
                        'supplier_id'    => $this->inventoryItem->supplier_id,
                        // supplier name populated when the relation is loaded (Phase 5)
                        'supplier_name'  => $this->inventoryItem->relationLoaded('supplier')
                            ? $this->inventoryItem->supplier?->name
                            : null,
                    ],
                ],
            ),
        ];
    }
}
