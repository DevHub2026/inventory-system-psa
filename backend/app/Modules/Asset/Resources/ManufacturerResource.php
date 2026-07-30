<?php

namespace App\Modules\Asset\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManufacturerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'description'     => $this->description,
            'is_active'       => $this->is_active,
            'created_by'      => $this->created_by,
            'updated_by'      => $this->updated_by,
            'created_by_name' => $this->created_by ? optional(User::find($this->created_by))->full_name : null,
            'updated_by_name' => $this->updated_by ? optional(User::find($this->updated_by))->full_name : null,
            'created_at'      => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'      => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
