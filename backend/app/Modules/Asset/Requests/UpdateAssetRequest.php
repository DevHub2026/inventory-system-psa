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
 *   status, condition_status, remarks, property_number
 *
 * property_number is ASSET-OWNED — it identifies one physical instance
 * (e.g. one of 20 laptops → 20 property numbers). It is editable here.
 *
 * DEPRECATED (read-only going forward)
 * ─────────────────────────────────────
 *   purchase_date, purchase_cost, warranty_until
 *
 * These procurement fields are now owned by Inventory (inventory_items).
 * The Asset record keeps the columns for historical data and display, but
 * they must no longer be written via this endpoint.  The frontend reads
 * them from asset.inventory.procurement instead.  The DB columns will be
 * dropped in a future migration after verification.
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
            'status'           => ['sometimes', 'required', new Enum(AssetStatus::class)],
            'condition_status' => ['nullable', new Enum(ConditionStatus::class)],
            'remarks'          => ['nullable', 'string'],
            'property_number'  => [
                'nullable', 'string', 'max:100',
                \Illuminate\Validation\Rule::unique('assets', 'property_number')->ignore($this->route('asset')?->id),
            ],

            // ── Inventory-owned fields — explicitly forbidden ───────────────
            // The framework returns a clear 422 if any of these are sent,
            // rather than silently accepting and then discarding them.
            'name'             => ['prohibited'],
            'description'      => ['prohibited'],
            'asset_number'     => ['prohibited'],
            'asset_category_id' => ['prohibited'],
            'manufacturer_id'  => ['prohibited'],
            'office_id'        => ['prohibited'],
            'location_id'      => ['prohibited'],
            'model'            => ['prohibited'],

            // ── Deprecated procurement fields — now owned by Inventory ──────
            // purchase_date, purchase_cost, warranty_until are read from
            // inventory_items (via asset.inventory.procurement in the API).
            // Sending them here returns a 422 so callers are guided to the
            // correct write path.  DB columns are kept until a future cleanup.
            'purchase_date'    => ['prohibited'],
            'purchase_cost'    => ['prohibited'],
            'warranty_until'   => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        $inventoryMsg  = 'This field is managed by the Inventory module and cannot be edited here. Open the linked Inventory Item to change it.';
        $procurementMsg = 'Procurement information is now managed by the Inventory module. Edit it from the linked Inventory Item (asset.inventory.procurement).';

        return [
            'name.prohibited'              => $inventoryMsg,
            'description.prohibited'       => $inventoryMsg,
            'asset_number.prohibited'      => $inventoryMsg,
            'asset_category_id.prohibited' => $inventoryMsg,
            'manufacturer_id.prohibited'   => $inventoryMsg,
            'office_id.prohibited'         => $inventoryMsg,
            'location_id.prohibited'       => $inventoryMsg,
            'model.prohibited'             => $inventoryMsg,
            'purchase_date.prohibited'     => $procurementMsg,
            'purchase_cost.prohibited'     => $procurementMsg,
            'warranty_until.prohibited'    => $procurementMsg,
        ];
    }
}
