<?php

namespace App\Modules\AssetCategory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetCategory\Requests\StoreAssetCategoryRequest;
use App\Modules\AssetCategory\Requests\UpdateAssetCategoryRequest;
use App\Modules\AssetCategory\Resources\AssetCategoryResource;
use App\Modules\AssetCategory\Services\AssetCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetCategoryController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly AssetCategoryService $assetCategoryService) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->assetCategoryService->list($request->all());

        return $this->success(
            AssetCategoryResource::collection($categories)->response()->getData(true),
            'Asset categories retrieved successfully.',
        );
    }

    public function store(StoreAssetCategoryRequest $request): JsonResponse
    {
        $category = $this->assetCategoryService->create($request->validated());

        return $this->success(
            AssetCategoryResource::make($category),
            'Asset category created successfully.',
            201,
        );
    }

    public function show(AssetCategory $assetCategory): JsonResponse
    {
        return $this->success(
            AssetCategoryResource::make($assetCategory),
            'Asset category retrieved successfully.',
        );
    }

    public function update(UpdateAssetCategoryRequest $request, AssetCategory $assetCategory): JsonResponse
    {
        $category = $this->assetCategoryService->update($assetCategory, $request->validated());

        return $this->success(
            AssetCategoryResource::make($category),
            'Asset category updated successfully.',
        );
    }

    public function destroy(AssetCategory $assetCategory): JsonResponse
    {
        $this->assetCategoryService->delete($assetCategory);

        return $this->success(null, 'Asset category deleted successfully.');
    }
}
