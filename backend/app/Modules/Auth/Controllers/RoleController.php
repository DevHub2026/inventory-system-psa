<?php

namespace App\Modules\Auth\Controllers;

use App\Models\Role;
use App\Modules\Auth\Requests\StoreRoleRequest;
use App\Modules\Auth\Requests\UpdateRoleRequest;
use App\Modules\Auth\Resources\RoleResource;
use App\Modules\Auth\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $roleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Role::query()->with('permissions');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereLikeInsensitive('name', $search);
        }

        $roles = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Roles retrieved successfully.',
            'data' => RoleResource::collection($roles),
            'meta' => [
                'current_page' => $roles->currentPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
                'last_page' => $roles->lastPage(),
            ],
        ]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roleService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
            'data' => new RoleResource($role->load('permissions')),
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Role retrieved successfully.',
            'data' => new RoleResource($role->load('permissions')),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if ($role->name === \App\Enums\UserRole::SUPER_ADMINISTRATOR->value && !auth()->user()->hasRole(\App\Enums\UserRole::SUPER_ADMINISTRATOR->value)) {
            abort(403, 'You cannot modify the Super Administrator role.');
        }

        $role = $this->roleService->update($role, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
            'data' => new RoleResource($role),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->name === \App\Enums\UserRole::SUPER_ADMINISTRATOR->value) {
            abort(403, 'You cannot delete the Super Administrator role.');
        }

        $this->roleService->delete($role);

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.',
            'data' => null,
        ]);
    }
}
