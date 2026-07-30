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
        $psaQrIdentifier = $this->whenLoaded(
            'identifiers',
            fn () => $this->identifiers->firstWhere('identifier_type', IdentifierType::PSA_QR->value),
        );

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
            'psa_qr_identifier' => $psaQrIdentifier?->identifier_value,
            'psa_qr_payload' => $psaQrIdentifier?->identifier_value,
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
        ];
    }
}
