<?php

namespace App\Modules\Unit\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Unit\Models\Unit;
use App\Modules\Unit\Requests\StoreUnitRequest;
use App\Modules\Unit\Requests\UpdateUnitRequest;
use App\Modules\Unit\Resources\UnitResource;
use App\Modules\Unit\Services\UnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function __construct(private readonly UnitService $unitService) {}

    public function index(Request $request): JsonResponse
    {
        $units = $this->unitService->list($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Units retrieved successfully.',
            'data' => UnitResource::collection($units)->response()->getData(true),
        ]);
    }

    public function store(StoreUnitRequest $request): JsonResponse
    {
        $unit = $this->unitService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully.',
            'data' => UnitResource::make($unit),
        ], 201);
    }

    public function show(Unit $unit): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Unit retrieved successfully.',
            'data' => UnitResource::make($unit->loadCount('inventoryItems')),
        ]);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): JsonResponse
    {
        $unit = $this->unitService->update($unit, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully.',
            'data' => UnitResource::make($unit->loadCount('inventoryItems')),
        ]);
    }

    public function destroy(Unit $unit): JsonResponse
    {
        try {
            $this->unitService->delete($unit);

            return response()->json([
                'success' => true,
                'message' => 'Unit deleted successfully.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
