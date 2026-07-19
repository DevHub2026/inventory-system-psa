<?php

namespace App\Modules\Asset\Resources;

use App\Modules\AssetCategory\Resources\AssetCategoryResource;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\AssetIdentifier\Resources\AssetIdentifierResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $psaQrIdentifier = $this->whenLoaded(
            'identifiers',
            fn () => $this->identifiers->firstWhere('identifier_type', IdentifierType::PSA_QR),
        );

        return [
            'id' => $this->id,
            'asset_number' => $this->asset_number,
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
            'psa_qr_identifier' => $psaQrIdentifier?->identifier_value,
            'psa_qr_payload' => $psaQrIdentifier?->identifier_value,
            'category' => AssetCategoryResource::make($this->whenLoaded('category')),
            'manufacturer' => ManufacturerResource::make($this->whenLoaded('manufacturer')),
            'office' => OfficeResource::make($this->whenLoaded('office')),
            'location' => LocationResource::make($this->whenLoaded('location')),
            'identifiers' => AssetIdentifierResource::collection($this->whenLoaded('identifiers')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
