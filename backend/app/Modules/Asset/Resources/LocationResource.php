<?php

namespace App\Modules\Asset\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'office_id' => $this->office_id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'office' => OfficeResource::make($this->whenLoaded('office')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
