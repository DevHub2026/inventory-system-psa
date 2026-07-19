<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function list(array $filters = []): Collection
    {
        $query = InventoryItem::query()->with('asset');

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%')
                ->orWhere('sku', 'like', '%'.$filters['search'].'%');
        }

        if (isset($filters['low_stock'])) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function create(array $data): InventoryItem
    {
        return DB::transaction(function () use ($data) {
            $trackAsAsset = (bool) ($data['track_as_asset'] ?? true);
            unset($data['track_as_asset']);

            $item = InventoryItem::create($data);

            if ($trackAsAsset) {
                $asset = $this->createAssetForInventoryItem($item);
                $item->update(['asset_id' => $asset->id]);
            }

            return $item->fresh('asset');
        });
    }

    public function update(InventoryItem $item, array $data): InventoryItem
    {
        $trackAsAsset = (bool) ($data['track_as_asset'] ?? false);
        unset($data['track_as_asset']);

        $item->update($data);

        if ($trackAsAsset && ! $item->asset_id) {
            $asset = $this->createAssetForInventoryItem($item->fresh());
            $item->update(['asset_id' => $asset->id]);
        }

        $this->syncLinkedAsset($item->fresh('asset'));

        return $item->fresh('asset');
    }

    public function delete(InventoryItem $item): void
    {
        $item->load('asset');

        if ($item->asset) {
            $item->asset->delete();
        }

        $item->delete();
    }

    public function stockIn(InventoryItem $item, int $quantity): InventoryItem
    {
        $item->update([
            'quantity' => $item->quantity + $quantity,
        ]);

        $this->syncLinkedAsset($item->fresh('asset'));

        return $item->fresh('asset');
    }

    public function stockOut(InventoryItem $item, int $quantity): InventoryItem
    {
        if ($item->quantity < $quantity) {
            throw new \InvalidArgumentException('Insufficient stock for stock-out operation.');
        }

        $item->update([
            'quantity' => $item->quantity - $quantity,
        ]);

        $this->syncLinkedAsset($item->fresh('asset'));

        return $item->fresh('asset');
    }

    private function createAssetForInventoryItem(InventoryItem $item): Asset
    {
        $asset = Asset::query()->create([
            'asset_number' => $this->uniqueAssetNumber($item->sku ?: 'INV-'.$item->id),
            'name' => $item->name,
            'description' => 'Linked from inventory item #'.$item->id.'.',
            'asset_category_id' => $this->defaultInventoryCategory()->id,
            'office_id' => $this->defaultOffice()->id,
            'status' => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
            'remarks' => $item->remarks,
        ]);

        AssetIdentifier::query()->firstOrCreate(
            [
                'asset_id' => $asset->id,
                'identifier_type' => IdentifierType::PSA_QR->value,
            ],
            [
                'identifier_value' => 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT),
                'is_primary' => true,
            ],
        );

        return $asset;
    }

    private function syncLinkedAsset(InventoryItem $item): void
    {
        if (! $item->asset) {
            return;
        }

        $item->asset->update([
            'name' => $item->name,
            'status' => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'remarks' => $item->remarks,
        ]);
    }

    private function uniqueAssetNumber(string $baseAssetNumber): string
    {
        $assetNumber = $baseAssetNumber;
        $suffix = 1;

        while (Asset::query()->where('asset_number', $assetNumber)->exists()) {
            $assetNumber = $baseAssetNumber.'-'.$suffix;
            $suffix++;
        }

        return $assetNumber;
    }

    private function defaultInventoryCategory(): AssetCategory
    {
        return AssetCategory::query()->firstOrCreate(
            ['code' => 'INV'],
            [
                'name' => 'Inventory Item',
                'description' => 'Automatically linked records created from inventory items.',
                'is_active' => true,
            ],
        );
    }

    private function defaultOffice(): Office
    {
        return Office::query()->firstOrCreate(
            ['code' => 'MAIN'],
            [
                'name' => 'Main Office',
                'description' => 'Default office for inventory-linked assets.',
                'is_active' => true,
            ],
        );
    }
}
