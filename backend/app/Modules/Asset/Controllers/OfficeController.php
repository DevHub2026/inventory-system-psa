<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Models\Office;
use App\Modules\Asset\Requests\StoreOfficeRequest;
use App\Modules\Asset\Requests\UpdateOfficeRequest;
use App\Modules\Asset\Resources\OfficeResource;
use App\Modules\Asset\Services\OfficeService;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly OfficeService $officeService) {}

    public function index(Request $request): JsonResponse
    {
        $offices = $this->officeService->list($request->all());

        return $this->success(
            OfficeResource::collection($offices)->response()->getData(true),
            'Offices retrieved successfully.',
        );
    }

    public function store(StoreOfficeRequest $request): JsonResponse
    {
        $office = $this->officeService->create($request->validated());

        return $this->success(OfficeResource::make($office), 'Office created successfully.', 201);
    }

    public function show(Office $office): JsonResponse
    {
        return $this->success(OfficeResource::make($office), 'Office retrieved successfully.');
    }

    public function update(UpdateOfficeRequest $request, Office $office): JsonResponse
    {
        $office = $this->officeService->update($office, $request->validated());

        return $this->success(OfficeResource::make($office), 'Office updated successfully.');
    }

    public function destroy(Office $office): JsonResponse
    {
        $this->officeService->delete($office);

        return $this->success(null, 'Office deleted successfully.');
    }
}
