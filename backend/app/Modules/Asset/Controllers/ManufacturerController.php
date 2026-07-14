<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Requests\StoreManufacturerRequest;
use App\Modules\Asset\Requests\UpdateManufacturerRequest;
use App\Modules\Asset\Resources\ManufacturerResource;
use App\Modules\Asset\Services\ManufacturerService;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManufacturerController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly ManufacturerService $manufacturerService) {}

    public function index(Request $request): JsonResponse
    {
        $manufacturers = $this->manufacturerService->list($request->all());

        return $this->success(
            ManufacturerResource::collection($manufacturers)->response()->getData(true),
            'Manufacturers retrieved successfully.',
        );
    }

    public function store(StoreManufacturerRequest $request): JsonResponse
    {
        $manufacturer = $this->manufacturerService->create($request->validated());

        return $this->success(
            ManufacturerResource::make($manufacturer),
            'Manufacturer created successfully.',
            201,
        );
    }

    public function show(Manufacturer $manufacturer): JsonResponse
    {
        return $this->success(
            ManufacturerResource::make($manufacturer),
            'Manufacturer retrieved successfully.',
        );
    }

    public function update(UpdateManufacturerRequest $request, Manufacturer $manufacturer): JsonResponse
    {
        $manufacturer = $this->manufacturerService->update($manufacturer, $request->validated());

        return $this->success(
            ManufacturerResource::make($manufacturer),
            'Manufacturer updated successfully.',
        );
    }

    public function destroy(Manufacturer $manufacturer): JsonResponse
    {
        $this->manufacturerService->delete($manufacturer);

        return $this->success(null, 'Manufacturer deleted successfully.');
    }
}
