<?php

namespace App\Modules\Borrowing\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Requests\StoreExtensionRequest;
use App\Modules\Borrowing\Services\BorrowExtensionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BorrowExtensionController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly BorrowExtensionService $extensionService) {}

    private function transform(BorrowExtensionRequest $request): array
    {
        return [
            'id' => $request->id,
            'borrowing_id' => $request->borrowing_id,
            'current_due_date' => $request->current_due_date?->format('Y-m-d'),
            'requested_due_date' => $request->requested_due_date?->format('Y-m-d'),
            'reason' => $request->reason,
            'status' => $request->status instanceof \App\Modules\Borrowing\Enums\ExtensionRequestStatus
                ? $request->status->value
                : $request->status,
            'status_label' => $request->status instanceof \App\Modules\Borrowing\Enums\ExtensionRequestStatus
                ? $request->status->label()
                : ucfirst($request->status ?? ''),
            'reviewed_by' => $request->reviewed_by,
            'reviewer_name' => $request->reviewer?->full_name ?: $request->reviewer?->email,
            'reviewed_at' => $request->reviewed_at?->format('Y-m-d H:i:s'),
            'remarks' => $request->remarks,
            'created_at' => $request->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function index(Borrowing $borrowing): JsonResponse
    {
        $user = request()->user();

        // Borrowers can only view their own extension requests
        if ($borrowing->user_id !== $user->id && ! $this->extensionService->canManageExtensions($user)) {
            return $this->error('You do not have permission to view these extension requests.', null, 403);
        }

        $requests = $this->extensionService->findByBorrowing($borrowing->id);

        return $this->success(
            $requests->map(fn (BorrowExtensionRequest $r) => $this->transform($r))->values(),
            'Extension requests retrieved successfully.',
        );
    }

    public function store(StoreExtensionRequest $request, Borrowing $borrowing): JsonResponse
    {
        try {
            $extension = $this->extensionService->create(
                $request->user(),
                $borrowing,
                $request->validated(),
            );

            return $this->success(
                $this->transform($extension),
                'Extension request submitted successfully.',
                201,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function approve(Request $request, BorrowExtensionRequest $extensionRequest): JsonResponse
    {
        $user = $request->user();

        if (! $this->extensionService->canManageExtensions($user)) {
            return $this->error('You do not have permission to approve extension requests.', null, 403);
        }

        try {
            $extension = $this->extensionService->approve($user, $extensionRequest);

            return $this->success(
                $this->transform($extension),
                'Extension request approved successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function reject(Request $request, BorrowExtensionRequest $extensionRequest): JsonResponse
    {
        $user = $request->user();

        if (! $this->extensionService->canManageExtensions($user)) {
            return $this->error('You do not have permission to reject extension requests.', null, 403);
        }

        $validated = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $extension = $this->extensionService->reject($user, $extensionRequest, $validated['remarks'] ?? null);

            return $this->success(
                $this->transform($extension),
                'Extension request rejected.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function pendingCount(): JsonResponse
    {
        $count = $this->extensionService->countPending();

        return $this->success(['count' => $count], 'Pending extension requests count retrieved.');
    }
}