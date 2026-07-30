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
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

        // Handle unit - could be string (old) or Unit model (new)
        $unitName = is_string($item->unit) ? $item->unit : ($item->unit?->name ?? '');
        
        return [
            'id' => $item->id,
            'asset_id' => $item->asset_id,
            'asset_number' => $item->asset?->asset_number,
            'property_number' => $item->asset?->property_number,
            'type' => $item->type,
            'classification' => $item->classification,
            'item_nature' => $item->item_nature,
            'classification_reason' => $item->classification_reason,
            'name' => $item->name,
            'sku' => $item->sku,
            'quantity' => $item->quantity,
            'unit' => $unitName,
            'unit_id' => $item->unit_id,
            'unit_name' => $unitName,
            'manufacturer_id' => $item->manufacturer_id,
            'manufacturer_name' => $item->manufacturer?->name,
            'office_id' => $item->office_id,
            'office_name' => $item->office?->name,
            'location_id' => $item->location_id,
            'location_name' => $item->location?->name,
            'reorder_level' => $item->reorder_level,
            'status' => $status,
            'accountability' => $item->classification === 'SUPPLY'
                ? '—'
                : ($item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : (filled($item->asset?->issued_to)
                        ? 'Issued to '.$item->asset?->issued_to
                        : 'Unassigned')),
            'is_unlinked_holder' => $item->asset?->issued_to_user_id === null && filled($item->asset?->issued_to),
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

    public function validateSku(Request $request): JsonResponse
    {
        $sku = trim((string) $request->query('sku', ''));
        $ignoreId = $request->query('ignore_id') ? (int) $request->query('ignore_id') : null;

        if ($sku === '') {
            return $this->success(['exists' => false, 'message' => 'SKU is empty']);
        }

        $inventoryExists = InventoryItem::query()
            ->where('sku', $sku)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        $assetExists = \App\Modules\Asset\Models\Asset::query()
            ->where('asset_number', $sku)
            ->orWhere('property_number', $sku)
            ->exists();

        $exists = $inventoryExists || $assetExists;

        return $this->success([
            'exists' => $exists,
            'message' => $exists ? 'Item Code / SKU already exists.' : 'Item Code / SKU is available.',
        ]);
    }

    public function simpleList(Request $request): JsonResponse
    {
        $items = $this->inventoryService->list($request->all(), 100);

        return $this->success(
            collect($items->items())->map(fn (InventoryItem $i) => $this->transform($i))->values(),
            'Inventory items retrieved successfully.'
        );
    }

    public function show(InventoryItem $item): JsonResponse
    {
        return $this->success($this->transform($item), 'Inventory item retrieved successfully.');
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

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $path = $request->file('file')->store('imports');

        try {
            $result = $this->inventoryService->importFromExcel(Storage::path($path));
            Storage::delete($path);

            return $this->success($result, 'Import completed.');
        } catch (\Exception $e) {
            Storage::delete($path);
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function export(Request $request): JsonResponse
    {
        try {
            $format = $request->query('format', 'xlsx');
            $path = $this->inventoryService->export($request->all(), $format);

            return $this->success([
                'path' => $path,
                'url' => url('storage/'.$path),
                'filename' => basename($path),
            ], 'Export generated successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 500);
        }
    }

    public function downloadExport(Request $request): BinaryFileResponse|JsonResponse
    {
        try {
            $format = $request->query('format', 'xlsx');
            $path = $this->inventoryService->export($request->all(), $format);

            $contentType = $format === 'csv'
                ? 'text/csv'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            return response()->download(
                Storage::path($path),
                basename($path),
                ['Content-Type' => $contentType],
            )->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 500);
        }
    }
}
