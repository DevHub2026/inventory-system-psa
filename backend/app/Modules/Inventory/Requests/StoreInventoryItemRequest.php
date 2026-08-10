<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates Inventory create and update requests.
 *
 * FIELD OWNERSHIP POLICY
 * ──────────────────────
 * INVENTORY-OWNED (editable here):
 *   name, sku, classification, item_nature, type, unit, unit_id,
 *   quantity, unit_cost, reorder_level, remarks, is_borrowable,
 *   manufacturer_id, office_id, location_id,
 *   model, description, asset_category_id
 *
 * IDENTIFIER FIELDS (editable here — Inventory is the user-facing management point):
 *   property_number    → stored on assets.property_number, synced via InventoryService
 *   serial_number      → stored as AssetIdentifier(SERIAL_NUMBER), synced via InventoryService
 *
 * ASSET-OWNED (NOT accepted here):
 *   condition_status   → edit via Asset module only
 *   asset_number       → auto-generated; editable via asset_number field below
 *
 * office_id / location_id are accepted here as "Default Office /
 * Default Location" used only when a new linked Asset is first created.
 * They do NOT overwrite the current office/location of an existing Asset.
 */
class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $item   = $this->route('item');
        $isEdit = $item !== null;   // true on PUT/PATCH, false on POST

        return [
            // ── Core identity ─────────────────────────────────────────────
            'name'                  => [$isEdit ? 'sometimes' : 'required', 'string', 'max:255'],
            'sku'                   => [
                $isEdit ? 'sometimes' : 'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'sku')
                    ->ignore($item?->id)
                    ->whereNull('deleted_at'),
            ],
            'description'           => ['nullable', 'string'],

            // ── Classification ────────────────────────────────────────────
            'type'                  => ['nullable', 'string', Rule::in(['non_expendable', 'expendable'])],
            'item_type_id'          => ['nullable', 'integer', 'exists:inventory_item_types,id'],
            'classification'        => ['nullable', 'string', Rule::in(['PPE', 'SE', 'SUPPLY'])],
            'item_nature'           => ['nullable', 'string', Rule::in(['ACCOUNTABLE_PROPERTY', 'CONSUMABLE_SUPPLY'])],
            'classification_reason' => ['nullable', 'string', 'max:1000'],

            // ── Stock & cost ──────────────────────────────────────────────
            'quantity'              => [$isEdit ? 'sometimes' : 'required', 'integer', 'min:0'],
            'unit_cost'             => ['nullable', 'numeric', 'min:0'],
            'purchase_date'         => ['nullable', 'date'],
            'warranty_until'        => ['nullable', 'date'],
            'supplier_id'           => ['nullable', 'integer'],
            'reorder_level'         => ['nullable', 'integer', 'min:0'],

            // ── Unit of measure (FK preferred, legacy string fallback) ─────
            'unit'                  => ['nullable', 'string', 'max:50'],
            'unit_id'               => ['nullable', 'integer', 'exists:units,id'],

            // ── Shared item details ───────────────────────────────────────
            'manufacturer_id'       => ['nullable', 'integer', 'exists:manufacturers,id'],
            'model'                 => ['nullable', 'string', 'max:255'],
            'asset_category_id'     => ['nullable', 'integer', 'exists:asset_categories,id'],

            // ── Default assignment (initial-creation values for linked Asset)
            'office_id'             => ['nullable', 'integer', 'exists:offices,id'],
            'location_id'           => ['nullable', 'integer', 'exists:locations,id'],

            // ── Borrowing policy ──────────────────────────────────────────
            'is_borrowable'         => ['nullable', 'boolean'],

            // ── Internal notes ────────────────────────────────────────────
            'remarks'               => ['nullable', 'string'],

            // ── Internal flags ────────────────────────────────────────────
            'track_as_asset'        => ['nullable', 'boolean'],

            // ── Identifier fields (Inventory is the user-facing management point) ──
            // These are stored on the linked Asset / AssetIdentifier, not on inventory_items.
            // InventoryService syncs them to the appropriate records on save.
            'property_number'       => [
                'nullable', 'string', 'max:100',
                // Uniqueness is checked against assets.property_number; ignore the
                // asset that is already linked to this inventory item.
                \Illuminate\Validation\Rule::unique('assets', 'property_number')
                    ->ignore(
                        $item?->asset_id,  // null on create (no asset yet)
                    )
                    ->whereNull('deleted_at'),
            ],
            'serial_number'         => ['nullable', 'string', 'max:255'],

            // ── Asset-operational fields — NOT accepted here ───────────────
            'condition_status'      => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        $assetMsg = 'This field belongs to the individual Asset record and cannot be set through Inventory. Use the Asset module to change it.';

        return [
            'sku.unique'                    => 'An item with this Item Code / SKU already exists.',
            'property_number.unique'        => 'A different asset already uses this Property Number.',
            'condition_status.prohibited'   => $assetMsg,
        ];
    }
}