<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Requests\AssignPermanentIssuanceRequest;
use App\Modules\Asset\Resources\IssuanceUserDirectoryResource;
use App\Modules\Asset\Resources\IssuanceUserSearchResource;
use App\Modules\Asset\Resources\PermanentIssuanceResource;
use App\Modules\Asset\Services\AssetIssuanceService;
use App\Modules\Asset\Services\IssuanceAuthorization;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermanentIssuanceController extends Controller
{
    use AuthorizesRequests;
    use RespondsWithJson;

    public function __construct(
        private readonly AssetIssuanceService $issuanceService,
        private readonly IssuanceAuthorization $authorization,
    ) {}

    public function searchUsers(Request $request): JsonResponse
    {
        try {
            $users = $this->issuanceService->searchUsersForPicker($request->user(), $request->all());
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 403);
        }

        return $this->success([
            'items' => IssuanceUserSearchResource::collection($users->items())->resolve(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ], 'Issuance user search completed successfully.');
    }

    public function directoryUsers(Request $request): JsonResponse
    {
        try {
            $users = $this->issuanceService->listUsersForDirectory($request->user(), $request->all());
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 403);
        }

        return $this->success([
            'items' => IssuanceUserDirectoryResource::collection($users->items())->resolve(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ], 'Issuance directory retrieved successfully.');
    }

    public function userAssets(Request $request, User $user): JsonResponse
    {
        try {
            $result = $this->issuanceService->listAssetsForUser($request->user(), $user, $request->all());
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 403);
        }

        return $this->success([
            'user' => IssuanceUserSearchResource::make($result['user']),
            'items' => PermanentIssuanceResource::collection($result['items'])->resolve(),
        ], 'Permanent issuances retrieved successfully.');
    }

    public function assign(AssignPermanentIssuanceRequest $request, Asset $asset): JsonResponse
    {
        $this->authorize('issue', $asset);

        try {
            $asset = $this->issuanceService->assignInitial(
                $request->user(),
                $asset,
                (int) $request->validated('issued_to_user_id'),
                (string) $request->validated('date_issued'),
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        } catch (\App\Modules\Asset\Exceptions\AssetNotAvailableException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success(
            PermanentIssuanceResource::make($asset),
            'Asset permanently issued successfully.',
        );
    }
}
