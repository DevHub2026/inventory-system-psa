<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Requests\StoreAssetRequest;
use App\Modules\Asset\Requests\TransferAssetRequest;
use App\Modules\Asset\Requests\UpdateAssetRequest;
use App\Modules\Asset\Resources\AssetResource;
use App\Modules\Asset\Services\AssetService;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    use AuthorizesRequests;
    use RespondsWithJson;

    public function __construct(private readonly AssetService $assetService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Asset::class);

        $assets = $this->assetService->list($request->all());

        return $this->success([
            'items' => AssetResource::collection($assets)->resolve(),
            'meta' => [
                'current_page' => $assets->currentPage(),
                'per_page' => $assets->perPage(),
                'total' => $assets->total(),
                'last_page' => $assets->lastPage(),
            ],
            'links' => [
                'first' => $assets->url(1),
                'last' => $assets->url($assets->lastPage()),
                'prev' => $assets->previousPageUrl(),
                'next' => $assets->nextPageUrl(),
            ],
        ], 'Assets retrieved successfully.');
    }

    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Asset::class);

        $term = (string) $request->query('search', '');
        $perPage = (int) $request->query('per_page', 20);

        $assets = $this->assetService->search($term, $perPage);

        return $this->success(
            AssetResource::collection($assets)->response()->getData(true),
            'Asset search completed successfully.',
        );
    }

    public function store(StoreAssetRequest $request): JsonResponse
    {
        $this->authorize('create', Asset::class);

        $asset = $this->assetService->create($request->validated());

        return $this->success(
            AssetResource::make($asset),
            'Asset created successfully.',
            201,
        );
    }

    public function show(Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $asset = $this->assetService->find($asset);

        return $this->success(
            AssetResource::make($asset),
            'Asset retrieved successfully.',
        );
    }

    public function update(UpdateAssetRequest $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $asset = $this->assetService->update($asset, $request->validated());

        return $this->success(
            AssetResource::make($asset),
            'Asset updated successfully.',
        );
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $this->authorize('delete', $asset);

        $this->assetService->delete($asset);

        return $this->success(null, 'Asset archived successfully.');
    }

    public function archive(Asset $asset): JsonResponse
    {
        $this->authorize('archive', $asset);

        $asset = $this->assetService->archive($asset);

        return $this->success(
            AssetResource::make($asset),
            'Asset archived successfully.',
        );
    }

    public function transfer(TransferAssetRequest $request, Asset $asset): JsonResponse
    {
        $this->authorize('transfer', $asset);

        $asset = $this->assetService->transfer($asset, $request->validated());

        return $this->success(
            AssetResource::make($asset),
            'Asset transferred successfully.',
        );
    }

    public function scan(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Asset::class);

        $value = (string) $request->query('value', $request->input('value', ''));
        $value = trim($value);

        if ($value === '') {
            return $this->error('Identifier value is required.', [
                'value' => ['The value field is required.'],
            ], 422);
        }

        if (mb_strlen($value) > 255) {
            return $this->error('Identifier value is invalid.', [
                'value' => ['The value field may not be greater than 255 characters.'],
            ], 422);
        }

        $asset = $this->assetService->findByIdentifier($value);

        if (! $asset) {
            return $this->error('Asset not found for the given identifier.', null, 404);
        }

        return $this->success(
            AssetResource::make($asset),
            'Asset retrieved successfully.',
        );
    }

    /**
     * PATCH /api/v1/assets/{asset}/borrowable
     *
     * Toggle the is_borrowable flag on the linked InventoryItem.
     *
     * Business rules
     * ──────────────
     * Disabling (true → false):
     *   • Rejected if the asset is currently BORROWED or has an active
     *     borrowing record (status = BORROWED / ACTIVE / OVERDUE).
     *   • Rejected if the asset has an open reservation (PENDING or APPROVED).
     *   • Rejected if the asset is permanently issued (has an accountable
     *     holder) AND currently BORROWED — the check above already covers
     *     this, but the message is explicit.
     *   • Allowed in all other states: AVAILABLE, MAINTENANCE, UNAVAILABLE,
     *     RETIRED, FOR_DISPOSAL, DISPOSED.  A non-borrowable item can still
     *     be permanently issued or maintained; it simply cannot enter the
     *     borrowing workflow.
     *
     * Enabling (false → true):
     *   • Always allowed — no active-borrow conflict is possible because the
     *     item was not available for borrowing in the first place.
     *   • Rejected only if the linked InventoryItem is a SUPPLY item
     *     (is_borrowable must not be enabled for consumable supplies).
     *
     * No-op:
     *   • Returns 200 with the current state when the requested value matches
     *     the stored value (idempotent).
     *
     * Standalone assets (no linked InventoryItem):
     *   • Return 422 — the borrowable concept is tied to the Inventory layer.
     */
    public function setBorrowable(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'is_borrowable' => ['required', 'boolean'],
        ]);

        $isBorrowable = (bool) $validated['is_borrowable'];

        // Locate the linked inventory item
        $inventoryItem = InventoryItem::query()
            ->where('asset_id', $asset->id)
            ->first();

        if (! $inventoryItem) {
            return $this->error(
                'This asset has no linked inventory item. The borrowable setting is only available for assets created through the Inventory module.',
                null,
                422,
            );
        }

        // Guard: supply items must never be made borrowable
        if ($isBorrowable && $inventoryItem->classification === 'SUPPLY') {
            return $this->error(
                'Supply items cannot be made borrowable. Only individually-tracked PPE or SE items support the borrowing workflow.',
                null,
                422,
            );
        }

        // No-op — value already matches
        if ((bool) $inventoryItem->is_borrowable === $isBorrowable) {
            return $this->success(
                [
                    'is_borrowable'        => $isBorrowable,
                    'inventory_item_id'    => $inventoryItem->id,
                ],
                'Borrowable setting is already '.($isBorrowable ? 'enabled' : 'disabled').'.',
            );
        }

        // Guard: cannot disable borrowing while the asset is actively borrowed or reserved
        if (! $isBorrowable) {
            $activeBorrowing = Borrowing::query()
                ->where('asset_id', $asset->id)
                ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
                ->exists();

            if ($activeBorrowing) {
                return $this->error(
                    'Cannot disable borrowing while this asset has an active borrowing transaction. Complete or revoke the borrowing first.',
                    null,
                    422,
                );
            }

            $openReservation = Reservation::query()
                ->whereIn('status', ['PENDING', 'APPROVED'])
                ->whereHas('assets', fn ($q) => $q
                    ->where('assets.id', $asset->id)
                    ->whereNull('reservation_items.fulfilled_at'))
                ->exists();

            if ($openReservation) {
                return $this->error(
                    'Cannot disable borrowing while this asset has an open borrow request. Resolve the pending or approved request first.',
                    null,
                    422,
                );
            }
        }

        // Apply the change to the inventory item
        $inventoryItem->update(['is_borrowable' => $isBorrowable]);

        return $this->success(
            [
                'is_borrowable'        => $isBorrowable,
                'inventory_item_id'    => $inventoryItem->id,
            ],
            'Borrowable setting '.($isBorrowable ? 'enabled' : 'disabled').' successfully.',
        );
    }

    public function validateCode(Request $request): JsonResponse
    {
        $code = trim((string) $request->query('code', ''));
        $ignoreId = $request->query('ignore_id') ? (int) $request->query('ignore_id') : null;

        if ($code === '') {
            return $this->success(['exists' => false, 'message' => 'Code is empty']);
        }

        $assetExists = Asset::query()
            ->where(function ($q) use ($code): void {
                $q->where('asset_number', $code)
                    ->orWhere('property_number', $code);
            })
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        $inventoryExists = \App\Models\InventoryItem::query()
            ->where('sku', $code)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        $exists = $assetExists || $inventoryExists;

        return $this->success([
            'exists' => $exists,
            'message' => $exists ? 'Item Code / SKU already exists.' : 'Item Code / SKU is available.',
        ]);
    }
}
