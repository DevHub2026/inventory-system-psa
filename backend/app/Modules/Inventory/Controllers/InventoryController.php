<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\StockTransaction;
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
        $status = match (true) {
            $item->quantity <= 0 => 'OUT_OF_STOCK',
            $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'LOW_STOCK',
            default => 'IN_STOCK',
        };

        return [
            'id' => $item->id,
            'asset_id' => $item->asset_id,
            'asset_number' => $item->asset?->asset_number,
            'name' => $item->name,
            'sku' => $item->sku,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'reorder_level' => $item->reorder_level,
            'status' => $status,
            'remarks' => $item->remarks,
        ];
    }

    private function transformMovement(StockTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'inventory_item_id' => $transaction->inventory_item_id,
            'item_name' => $transaction->inventoryItem?->name,
            'type' => $transaction->type,
            'quantity' => $transaction->quantity,
            'quantity_before' => $transaction->quantity_before,
            'quantity_after' => $transaction->quantity_after,
            'reason' => $transaction->reason,
            'remarks' => $transaction->remarks,
            'performed_by' => $transaction->user?->full_name ?: $transaction->user?->email,
            'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $items = $this->inventoryService->list($request->all(), $perPage);

        return $this->success([
            'items' => collect($items->items())->map(fn (InventoryItem $i) => $this->transform($i))->values(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
            'links' => [
                'first' => $items->url(1),
                'last' => $items->url($items->lastPage()),
                'prev' => $items->previousPageUrl(),
                'next' => $items->nextPageUrl(),
            ],
        ], 'Inventory items retrieved successfully.');
    }

    public function store(StoreInventoryItemRequest $request): JsonResponse
    {
        $item = $this->inventoryService->create($request->validated(), $request->user());

        return $this->success($this->transform($item), 'Inventory item created successfully.', 201);
    }

    public function stockIn(InventoryItem $item, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $item = $this->inventoryService->stockIn(
            $item,
            (int) $validated['quantity'],
            $validated['reason'] ?? null,
            $request->user(),
        );

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
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $item = $this->inventoryService->stockOut(
            $item,
            (int) $validated['quantity'],
            $validated['reason'] ?? null,
            $request->user(),
        );

        return $this->success($this->transform($item), 'Stock out completed successfully.');
    }

    public function adjust(InventoryItem $item, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $item = $this->inventoryService->adjust(
            $item,
            (int) $validated['quantity'],
            $validated['reason'],
            $request->user(),
        );

        return $this->success($this->transform($item), 'Stock quantity corrected successfully.');
    }

    public function history(InventoryItem $item, Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $transactions = $this->inventoryService->history($item, $perPage);

        return $this->success([
            'items' => collect($transactions->items())->map(fn (StockTransaction $transaction) => $this->transformMovement($transaction))->values(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
            'links' => [
                'first' => $transactions->url(1),
                'last' => $transactions->url($transactions->lastPage()),
                'prev' => $transactions->previousPageUrl(),
                'next' => $transactions->nextPageUrl(),
            ],
        ], 'Stock movement history retrieved successfully.');
    }
}
