<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Requests\StoreLocationRequest;
use App\Modules\Asset\Requests\UpdateLocationRequest;
use App\Modules\Asset\Resources\LocationResource;
use App\Modules\Asset\Services\LocationService;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly LocationService $locationService) {}

    public function index(Request $request): JsonResponse
    {
        $locations = $this->locationService->list($request->all());

        return $this->success(
            LocationResource::collection($locations)->response()->getData(true),
            'Locations retrieved successfully.',
        );
    }

    public function store(StoreLocationRequest $request): JsonResponse
    {
        $location = $this->locationService->create($request->validated());

        return $this->success(LocationResource::make($location), 'Location created successfully.', 201);
    }

    public function show(Location $location): JsonResponse
    {
        $location->load('office');

        return $this->success(LocationResource::make($location), 'Location retrieved successfully.');
    }

    public function update(UpdateLocationRequest $request, Location $location): JsonResponse
    {
        $location = $this->locationService->update($location, $request->validated());

        return $this->success(LocationResource::make($location), 'Location updated successfully.');
    }

    public function destroy(Location $location): JsonResponse
    {
        $this->locationService->delete($location);

        return $this->success(null, 'Location deleted successfully.');
    }
}
