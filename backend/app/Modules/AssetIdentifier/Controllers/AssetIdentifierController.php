<?php

namespace App\Modules\AssetIdentifier\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\AssetIdentifier\Requests\StoreAssetIdentifierRequest;
use App\Modules\AssetIdentifier\Requests\UpdateAssetIdentifierRequest;
use App\Modules\AssetIdentifier\Resources\AssetIdentifierResource;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetIdentifierController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly AssetIdentifierService $assetIdentifierService) {}

    public function index(Request $request): JsonResponse
    {
        $identifiers = $this->assetIdentifierService->list($request->all());

        return $this->success(
            AssetIdentifierResource::collection($identifiers)->response()->getData(true),
            'Asset identifiers retrieved successfully.',
        );
    }

    public function store(StoreAssetIdentifierRequest $request): JsonResponse
    {
        $identifier = $this->assetIdentifierService->create($request->validated());

        return $this->success(
            AssetIdentifierResource::make($identifier),
            'Asset identifier created successfully.',
            201,
        );
    }

    public function show(AssetIdentifier $assetIdentifier): JsonResponse
    {
        $assetIdentifier->load('asset');

        return $this->success(
            AssetIdentifierResource::make($assetIdentifier),
            'Asset identifier retrieved successfully.',
        );
    }

    public function update(
        UpdateAssetIdentifierRequest $request,
        AssetIdentifier $assetIdentifier,
    ): JsonResponse {
        $identifier = $this->assetIdentifierService->update($assetIdentifier, $request->validated());

        return $this->success(
            AssetIdentifierResource::make($identifier),
            'Asset identifier updated successfully.',
        );
    }

    public function destroy(AssetIdentifier $assetIdentifier): JsonResponse
    {
        $this->assetIdentifierService->delete($assetIdentifier);

        return $this->success(null, 'Asset identifier deleted successfully.');
    }
}
