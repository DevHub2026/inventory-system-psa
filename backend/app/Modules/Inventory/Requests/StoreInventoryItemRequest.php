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
 * ASSET-OWNED (NOT accepted here — belong to the individual Asset):
 *   condition_status   → edit via Asset module
 *   property_number    → edit via Asset module
 *   asset_number       → auto-generated, never editable
 *   serial_number      → edit via Asset identifier management
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

            // ── Asset-owned fields — explicitly prohibited ─────────────────
            'condition_status'      => ['prohibited'],
            'property_number'       => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        $assetMsg = 'This field belongs to the individual Asset record and cannot be set through Inventory. Use the Asset module to change it.';

        return [
            'sku.unique'                    => 'An item with this Item Code / SKU already exists.',
            'condition_status.prohibited'   => $assetMsg,
            'property_number.prohibited'    => $assetMsg,
        ];
    }
}
