<?php

namespace App\Modules\Asset\Resources;

use App\Modules\Asset\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermanentIssuanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Asset $asset */
        $asset = $this->resource;

        $isLinkedUser = $asset->issued_to_user_id !== null;

        return [
            'asset_id' => $asset->id,
            'asset_number' => $asset->asset_number,
            'property_number' => $asset->property_number,
            'asset_name' => $asset->name,
            'asset_code' => $asset->asset_number,
            'category' => $asset->category?->name,
            'office' => $asset->office?->name,
            'location' => $asset->location?->name,
            'date_issued' => $asset->date_issued?->format('Y-m-d'),
            'issued_by' => $asset->issuedByUser?->full_name,
            'issued_by_user_id' => $asset->issued_by_user_id,
            'issued_to_user_id' => $asset->issued_to_user_id,
            'issued_to' => $asset->issued_to,
            'is_unlinked_holder' => ! $isLinkedUser && filled($asset->issued_to),
            'issuance_status' => 'current',
            'asset_status' => $asset->status instanceof \BackedEnum ? $asset->status->value : $asset->status,
            'accountable_user' => $asset->issuedToUser ? IssuanceUserSearchResource::make($asset->issuedToUser) : null,
        ];
    }
}
