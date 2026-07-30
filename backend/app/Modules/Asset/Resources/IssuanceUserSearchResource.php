<?php

namespace App\Modules\Asset\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssuanceUserSearchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'employee_number' => $user->employee_number,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'department' => $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->name,
            ] : null,
            'office' => $user->office ? [
                'id' => $user->office->id,
                'name' => $user->office->name,
            ] : null,
            'roles' => $user->relationLoaded('roles')
                ? $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ])->values()
                : [],
        ];
    }
}
