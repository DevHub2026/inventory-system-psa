<?php

namespace App\Modules\Auth\Controllers;

use App\Models\Permission;
use App\Modules\Auth\Requests\StorePermissionRequest;
use App\Modules\Auth\Requests\UpdatePermissionRequest;
use App\Modules\Auth\Resources\PermissionResource;
use App\Modules\Auth\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PermissionController extends Controller
{
    public function __construct(
        private readonly PermissionService $permissionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('module', 'like', "%{$search}%");
        }

        if ($request->has('module')) {
            $query->where('module', $request->input('module'));
        }

        $permissions = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Permissions retrieved successfully.',
            'data' => PermissionResource::collection($permissions),
            'meta' => [
                'current_page' => $permissions->currentPage(),
                'per_page' => $permissions->perPage(),
                'total' => $permissions->total(),
                'last_page' => $permissions->lastPage(),
            ],
        ]);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = $this->permissionService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Permission created successfully.',
            'data' => new PermissionResource($permission),
        ], 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Permission retrieved successfully.',
            'data' => new PermissionResource($permission),
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        $permission = $this->permissionService->update($permission, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Permission updated successfully.',
            'data' => new PermissionResource($permission),
        ]);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $this->permissionService->delete($permission);

        return response()->json([
            'success' => true,
            'message' => 'Permission deleted successfully.',
            'data' => null,
        ]);
    }
}
