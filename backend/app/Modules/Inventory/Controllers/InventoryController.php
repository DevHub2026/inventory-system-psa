<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Requests\StoreInventoryItemRequest;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InventoryController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly InventoryService $inventoryService) {}

    private function transform(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'asset_id' => $item->asset_id,
            'asset_number' => $item->asset?->asset_number,
            'name' => $item->name,
            'sku' => $item->sku,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'reorder_level' => $item->reorder_level,
            'remarks' => $item->remarks,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $items = $this->inventoryService->list($request->all());

        return $this->success(
            $items->map(fn (InventoryItem $item) => $this->transform($item))->values(),
            'Inventory items retrieved successfully.',
        );
    }

    public function store(StoreInventoryItemRequest $request): JsonResponse
    {
        $item = $this->inventoryService->create($request->validated());

        return $this->success($this->transform($item), 'Inventory item created successfully.', 201);
    }

    public function stockIn(InventoryItem $item, Request $request): JsonResponse
    {
        $item = $this->inventoryService->stockIn($item, (int) $request->input('quantity', 0));

        return $this->success($this->transform($item), 'Stock in completed successfully.');
    }

    public function update(InventoryItem $item, StoreInventoryItemRequest $request): JsonResponse
    {
        $item = $this->inventoryService->update($item, $request->validated());

        return $this->success($this->transform($item), 'Inventory item updated successfully.');
    }

    public function destroy(InventoryItem $item): JsonResponse
    {
        $this->inventoryService->delete($item);

        return $this->success(null, 'Inventory item deleted successfully.');
    }

    public function stockOut(InventoryItem $item, Request $request): JsonResponse
    {
        $item = $this->inventoryService->stockOut($item, (int) $request->input('quantity', 0));

        return $this->success($this->transform($item), 'Stock out completed successfully.');
    }
}
