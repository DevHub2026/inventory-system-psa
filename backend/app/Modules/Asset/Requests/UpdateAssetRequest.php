<?php

namespace App\Modules\Asset\Requests;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validates the Asset UPDATE request.
 *
 * FIELD OWNERSHIP POLICY
 * ──────────────────────
 * The following fields are owned exclusively by the Inventory module.
 * They are written via InventoryService (and synced to the assets table
 * automatically by syncLinkedAsset / update).  Accepting them here would
 * create a second, conflicting write path for the same column.
 *
 * Locked fields (rejected silently — stripped before DB write):
 *   name, description, asset_category_id, manufacturer_id,
 *   office_id, location_id, model, property_number, asset_number
 *
 * The only editable fields through this endpoint are asset-operational:
 *   status, condition_status, remarks,
 *   purchase_date, purchase_cost, warranty_until
 */
class UpdateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ── Asset-operational fields (the only ones accepted here) ──────
            'status'          => ['sometimes', 'required', new Enum(AssetStatus::class)],
            'condition_status' => ['nullable', new Enum(ConditionStatus::class)],
            'remarks'         => ['nullable', 'string'],
            'purchase_date'   => ['nullable', 'date'],
            'purchase_cost'   => ['nullable', 'numeric', 'min:0'],
            'warranty_until'  => ['nullable', 'date'],

            // ── Inventory-owned fields — explicitly forbidden ───────────────
            // Listed here so the framework returns a clear 422 if the caller
            // tries to send them, rather than silently ignoring the data.
            'name'             => ['prohibited'],
            'description'      => ['prohibited'],
            'asset_number'     => ['prohibited'],
            'property_number'  => ['prohibited'],
            'asset_category_id' => ['prohibited'],
            'manufacturer_id'  => ['prohibited'],
            'office_id'        => ['prohibited'],
            'location_id'      => ['prohibited'],
            'model'            => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        $msg = 'This field is managed by the Inventory module and cannot be edited here. Open the linked Inventory Item to change it.';

        return [
            'name.prohibited'             => $msg,
            'description.prohibited'      => $msg,
            'asset_number.prohibited'     => $msg,
            'property_number.prohibited'  => $msg,
            'asset_category_id.prohibited' => $msg,
            'manufacturer_id.prohibited'  => $msg,
            'office_id.prohibited'        => $msg,
            'location_id.prohibited'      => $msg,
            'model.prohibited'            => $msg,
        ];
    }
}
