<?php

namespace App\Modules\Department\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Department\Models\Department;
use App\Modules\Department\Requests\StoreDepartmentRequest;
use App\Modules\Department\Requests\UpdateDepartmentRequest;
use App\Modules\Department\Resources\DepartmentResource;
use App\Modules\Department\Services\DepartmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function __construct(private readonly DepartmentService $departmentService) {}

    public function index(Request $request): JsonResponse
    {
        $departments = $this->departmentService->list($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Departments retrieved successfully.',
            'data' => DepartmentResource::collection($departments)->response()->getData(true),
        ]);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = $this->departmentService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully.',
            'data' => DepartmentResource::make($department),
        ], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Department retrieved successfully.',
            'data' => DepartmentResource::make($department->loadCount('users')),
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $department = $this->departmentService->update($department, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully.',
            'data' => DepartmentResource::make($department->loadCount('users')),
        ]);
    }

    public function destroy(Department $department): JsonResponse
    {
        try {
            $this->departmentService->delete($department);

            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
