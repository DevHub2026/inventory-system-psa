<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Inventory\Models\InventoryItemType;
use App\Modules\Inventory\Requests\StoreInventoryItemTypeRequest;
use App\Modules\Inventory\Requests\UpdateInventoryItemTypeRequest;
use App\Modules\Inventory\Resources\InventoryItemTypeResource;
use App\Modules\Inventory\Services\InventoryItemTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InventoryItemTypeController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly InventoryItemTypeService $typeService) {}

    public function index(Request $request): JsonResponse
    {
        $types = $this->typeService->list($request->all());

        return $this->success(
            InventoryItemTypeResource::collection($types)->response()->getData(true),
            'Inventory item types retrieved successfully.',
        );
    }

    public function store(StoreInventoryItemTypeRequest $request): JsonResponse
    {
        $type = $this->typeService->create($request->validated());

        return $this->success(InventoryItemTypeResource::make($type), 'Inventory item type created successfully.', 201);
    }

    public function show(InventoryItemType $inventoryItemType): JsonResponse
    {
        return $this->success(InventoryItemTypeResource::make($inventoryItemType), 'Inventory item type retrieved successfully.');
    }

    public function update(UpdateInventoryItemTypeRequest $request, InventoryItemType $inventoryItemType): JsonResponse
    {
        $type = $this->typeService->update($inventoryItemType, $request->validated());

        return $this->success(InventoryItemTypeResource::make($type), 'Inventory item type updated successfully.');
    }

    public function destroy(InventoryItemType $inventoryItemType): JsonResponse
    {
        try {
            $this->typeService->delete($inventoryItemType);
            return $this->success(null, 'Inventory item type deleted successfully.');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }
}