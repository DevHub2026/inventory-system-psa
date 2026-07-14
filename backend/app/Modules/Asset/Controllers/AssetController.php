<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Requests\StoreAssetRequest;
use App\Modules\Asset\Requests\TransferAssetRequest;
use App\Modules\Asset\Requests\UpdateAssetRequest;
use App\Modules\Asset\Resources\AssetResource;
use App\Modules\Asset\Services\AssetService;
use App\Modules\Asset\Traits\RespondsWithJson;
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

        if ($value === '') {
            return $this->error('Identifier value is required.', [
                'value' => ['The value field is required.'],
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
}
