<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Inventory\Models\InventoryCountSession;
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

        // Asset-level display fields (read-only in Inventory context)
        $assetStatus = $item->asset?->status instanceof \App\Modules\Asset\Enums\AssetStatus
            ? $item->asset->status->value
            : ($item->asset?->status ?? null);

        // Serial number — stored as AssetIdentifier(SERIAL_NUMBER) on the linked asset
        $serialNumber = null;
        if ($item->asset) {
            $item->asset->loadMissing('identifiers');
            $serialNumber = $item->asset->identifiers
                ->firstWhere('identifier_type', \App\Modules\Asset\Enums\IdentifierType::SERIAL_NUMBER->value)
                ?->identifier_value;
        }

        return [
            'id'                     => $item->id,
            'asset_id'               => $item->asset_id,
            'asset_number'           => $item->asset?->asset_number,
            'property_number'        => $item->asset?->property_number,
            'serial_number'          => $serialNumber,
            // ── Inventory-owned fields ─────────────────────────────────────
            'type'                   => $item->type,
            'item_type_id'           => $item->item_type_id,
            'item_type_name'         => $item->itemType?->name,
            'classification'         => $item->classification,
            'item_nature'            => $item->item_nature,
            'classification_reason'  => $item->classification_reason,
            'name'                   => $item->name,
            'description'            => $item->description
                                        ?? ($item->asset?->description),  // show asset description if no inv. description
            'sku'                    => $item->sku,
            'quantity'               => $item->quantity,
            'unit'                   => $unitName,
            'unit_id'                => $item->unit_id,
            'unit_name'              => $unitName,
            'manufacturer_id'        => $item->manufacturer_id,
            'manufacturer_name'      => $item->manufacturer?->name,
            'model'                  => $item->model ?? $item->asset?->model, // prefer inv-level model
            'asset_category_id'      => $item->asset_category_id
                                        ?? $item->asset?->asset_category_id,
            'asset_category_name'    => $item->assetCategory?->name
                                        ?? $item->asset?->category?->name,
            'office_id'              => $item->office_id,
            'office_name'            => $item->office?->name,
            'location_id'            => $item->location_id,
            'location_name'          => $item->location?->name,
            'reorder_level'          => $item->reorder_level,
            'is_borrowable'          => (bool) ($item->is_borrowable ?? true),
            'track_as_asset'         => (bool) ($item->track_as_asset ?? false),
            'remarks'                => $item->remarks,
            'unit_cost'              => $item->unit_cost !== null ? (float) $item->unit_cost : null,
            // ── Procurement (inventory-owned) ──────────────────────────────
            'purchase_date'          => $item->purchase_date?->format('Y-m-d'),
            'warranty_until'         => $item->warranty_until?->format('Y-m-d'),
            'supplier_id'            => $item->supplier_id,
            'supplier_name'          => $item->relationLoaded('supplier') ? $item->supplier?->name : null,
            // ── Stock status ───────────────────────────────────────────────
            'status'                 => $status,
            // ── Asset-reference fields (read-only display from linked Asset) ─
            'asset_status'           => $assetStatus,
            'accountability'         => $item->classification === 'SUPPLY'
                ? '—'
                : ($item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : (filled($item->asset?->issued_to)
                        ? 'Issued to '.$item->asset?->issued_to
                        : 'Unassigned')),
            'is_unlinked_holder'     => $item->asset?->issued_to_user_id === null && filled($item->asset?->issued_to),
            // ── Timestamps ────────────────────────────────────────────────
            'created_at'             => $item->created_at?->toISOString(),
            'updated_at'             => $item->updated_at?->toISOString(),
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
            'source_location_id' => $transaction->source_location_id,
            'destination_location_id' => $transaction->destination_location_id,
            'related_inventory_item_id' => $transaction->related_inventory_item_id,
            'transfer_uuid' => $transaction->transfer_uuid,
            'reason' => $transaction->reason,
            'remarks' => $transaction->remarks,
            'performed_by' => $transaction->user?->full_name ?: $transaction->user?->email,
            'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function transformCountSession(InventoryCountSession $session): array
    {
        return [
            'id' => $session->id,
            'location_id' => $session->location_id,
            'location_name' => $session->location?->name,
            'status' => $session->status,
            'counted_at' => $session->counted_at?->format('Y-m-d H:i:s'),
            'completed_at' => $session->completed_at?->format('Y-m-d H:i:s'),
            'reconciled_at' => $session->reconciled_at?->format('Y-m-d H:i:s'),
            'started_by' => $session->startedBy?->full_name ?: $session->startedBy?->email,
            'completed_by' => $session->completedBy?->full_name ?: $session->completedBy?->email,
            'reconciled_by' => $session->reconciledBy?->full_name ?: $session->reconciledBy?->email,
            'notes' => $session->notes,
            'items' => $session->relationLoaded('items')
                ? $session->items->map(fn ($countItem) => [
                    'id' => $countItem->id,
                    'inventory_item_id' => $countItem->inventory_item_id,
                    'item_name' => $countItem->inventoryItem?->name,
                    'sku' => $countItem->inventoryItem?->sku,
                    'expected_quantity' => $countItem->expected_quantity,
                    'actual_quantity' => $countItem->actual_quantity,
                    'variance' => $countItem->variance,
                    'remarks' => $countItem->remarks,
                    'counted_at' => $countItem->counted_at?->format('Y-m-d H:i:s'),
                    'counted_by' => $countItem->countedBy?->full_name ?: $countItem->countedBy?->email,
                    'reconciliation_transaction_id' => $countItem->reconciliation_transaction_id,
                ])->values()
                : [],
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

    /**
     * Generate a unique SKU suggestion.
     *
     * Returns a candidate SKU the user can accept or override.
     * Format: INV-YYYYMMDD-XXXX  (date + 4-char random hex)
     * The returned value is guaranteed unique in inventory_items at the time of
     * the call but the user is free to edit it before saving — final uniqueness
     * is enforced by the StoreInventoryItemRequest validation rule.
     */
    public function generateSku(Request $request): JsonResponse
    {
        $prefix = strtoupper(trim((string) $request->query('prefix', '')));
        $prefix = $prefix !== '' ? $prefix : 'INV';

        $date = now()->format('Ymd');
        $sku  = null;
        $attempts = 0;
        $maxAttempts = 20;

        do {
            $candidate = $prefix.'-'.$date.'-'.strtoupper(bin2hex(random_bytes(2)));
            $exists    = InventoryItem::query()->where('sku', $candidate)->exists();
            $attempts++;
        } while ($exists && $attempts < $maxAttempts);

        $sku = $candidate ?? ($prefix.'-'.$date.'-'.strtoupper(bin2hex(random_bytes(2))));

        return $this->success([
            'sku'     => $sku,
            'unique'  => ! $exists,
        ], 'SKU generated.');
    }

    public function validateSku(Request $request): JsonResponse
    {
        $sku = trim((string) $request->query('sku', ''));
        $ignoreId = $request->query('ignore_id') ? (int) $request->query('ignore_id') : null;

        if ($sku === '') {
            return $this->success(['exists' => false, 'message' => 'SKU is empty']);
        }

        // Check inventory_items — exclude the currently-edited item by its inventory ID.
        $inventoryExists = InventoryItem::query()
            ->where('sku', $sku)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($inventoryExists) {
            return $this->success([
                'exists' => true,
                'message' => 'Item Code / SKU already exists in inventory.',
            ]);
        }

        // Check assets — but skip the asset that is linked to the item currently being edited.
        // This prevents a false "duplicate" when the item's own SKU matches its linked asset_number.
        $linkedAssetId = $ignoreId
            ? InventoryItem::query()->where('id', $ignoreId)->value('asset_id')
            : null;

        $assetExists = \App\Modules\Asset\Models\Asset::query()
            ->where(function ($q) use ($sku): void {
                $q->where('asset_number', $sku)
                  ->orWhere('property_number', $sku);
            })
            ->when($linkedAssetId !== null, fn ($q) => $q->where('id', '!=', $linkedAssetId))
            ->exists();

        $exists = $assetExists;

        return $this->success([
            'exists' => $exists,
            'message' => $exists
                ? 'Item Code / SKU already exists as an asset identifier.'
                : 'Item Code / SKU is available.',
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
        $item->load(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier', 'itemType']);
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

    public function transfer(InventoryItem $item, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'source_location_id' => ['required', 'integer', 'exists:locations,id'],
            'destination_location_id' => ['required', 'integer', 'exists:locations,id', 'different:source_location_id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->inventoryService->transfer(
            $item,
            (int) $validated['quantity'],
            (int) $validated['source_location_id'],
            (int) $validated['destination_location_id'],
            $validated['reason'] ?? null,
            $request->user(),
        );

        return $this->success([
            'transfer_uuid' => $result['transfer_uuid'],
            'source_item' => $this->transform($result['source_item']),
            'destination_item' => $this->transform($result['destination_item']),
        ], 'Inventory transfer completed successfully.');
    }

    public function countSessions(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);
        $sessions = InventoryCountSession::query()
            ->with(['location', 'startedBy', 'completedBy', 'reconciledBy'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success([
            'items' => collect($sessions->items())->map(fn (InventoryCountSession $session) => $this->transformCountSession($session))->values(),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
                'last_page' => $sessions->lastPage(),
            ],
        ], 'Inventory count sessions retrieved successfully.');
    }

    public function createCountSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'counted_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $session = $this->inventoryService->createCountSession($validated, $request->user());

        return $this->success($this->transformCountSession($session), 'Inventory count session created successfully.', 201);
    }

    public function showCountSession(InventoryCountSession $session): JsonResponse
    {
        $session->load(['location', 'startedBy', 'completedBy', 'reconciledBy', 'items.inventoryItem', 'items.countedBy']);

        return $this->success($this->transformCountSession($session), 'Inventory count session retrieved successfully.');
    }

    public function recordCount(InventoryCountSession $session, InventoryItem $item, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actual_quantity' => ['required', 'integer', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $session = $this->inventoryService->recordCount(
            $session,
            $item,
            (int) $validated['actual_quantity'],
            $validated['remarks'] ?? null,
            $request->user(),
        );

        return $this->success($this->transformCountSession($session), 'Inventory count recorded successfully.');
    }

    public function completeCountSession(InventoryCountSession $session, Request $request): JsonResponse
    {
        $session = $this->inventoryService->completeCountSession($session, $request->user());

        return $this->success($this->transformCountSession($session), 'Inventory count session completed successfully.');
    }

    public function reconcileCountSession(InventoryCountSession $session, Request $request): JsonResponse
    {
        $session = $this->inventoryService->reconcileCountSession($session, $request->user());

        return $this->success($this->transformCountSession($session), 'Inventory count session reconciled successfully.');
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
