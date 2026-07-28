<?php

namespace App\Modules\Borrowing\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Borrowing\Enums\ExtensionRequestStatus;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Repositories\Contracts\BorrowExtensionRequestRepositoryInterface;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BorrowExtensionService
{
    public function __construct(
        private readonly BorrowExtensionRequestRepositoryInterface $repository,
        private readonly NotificationService $notificationService,
    ) {}

    public function findByBorrowing(int $borrowingId): Collection
    {
        return $this->repository->findByBorrowing($borrowingId);
    }

    public function hasPending(int $borrowingId): bool
    {
        return $this->repository->hasPending($borrowingId);
    }

    public function countPending(): int
    {
        return $this->repository->countPending();
    }

    public function create(User $user, Borrowing $borrowing, array $data): BorrowExtensionRequest
    {
        // Validate borrowing belongs to user
        if ($borrowing->user_id !== $user->id) {
            throw new \InvalidArgumentException('You can only request an extension for your own borrowings.');
        }

        // Validate borrowing is active
        if ($borrowing->status !== 'BORROWED') {
            throw new \InvalidArgumentException('Extension can only be requested for active borrowings.');
        }

        // Validate not returned
        if ($borrowing->returned_at !== null) {
            throw new \InvalidArgumentException('Cannot request extension for a returned borrowing.');
        }

        // Validate no pending request exists
        if ($this->repository->hasPending($borrowing->id)) {
            throw new \InvalidArgumentException('A pending extension request already exists for this borrowing.');
        }

        // Validate requested due date is after current due date
        $requestedDate = $data['requested_due_date'];
        $currentDueDate = $borrowing->due_date;

        if ($requestedDate <= $currentDueDate) {
            throw new \InvalidArgumentException('Requested due date must be later than the current due date.');
        }

        return DB::transaction(function () use ($borrowing, $data, $requestedDate, $currentDueDate) {
            $request = $this->repository->create([
                'borrowing_id' => $borrowing->id,
                'current_due_date' => $currentDueDate,
                'requested_due_date' => $requestedDate,
                'reason' => $data['reason'],
                'status' => ExtensionRequestStatus::PENDING,
            ]);

            $fresh = $request->fresh(['borrowing.user', 'borrowing.asset']);

            // Notify administrators
            $borrowerName = $fresh->borrowing?->user?->full_name ?: $fresh->borrowing?->user?->email ?? 'A borrower';
            $assetName = $fresh->borrowing?->asset?->name ?? 'an asset';

            $this->notificationService->notifyStaffAndAdmins(
                'Extension Requested',
                "{$borrowerName} requested an extension for {$assetName} until {$requestedDate}.",
                'extension_requested',
                $fresh->id,
                BorrowExtensionRequest::class,
                ['link' => '/borrowings'],
            );

            return $fresh;
        });
    }

    public function approve(User $reviewer, BorrowExtensionRequest $request): BorrowExtensionRequest
    {
        if ($request->status !== ExtensionRequestStatus::PENDING) {
            throw new \InvalidArgumentException('Only pending extension requests can be approved.');
        }

        return DB::transaction(function () use ($reviewer, $request) {
            // Update the extension request
            $updated = $this->repository->update($request->id, [
                'status' => ExtensionRequestStatus::APPROVED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            // Update the borrowing due date
            $borrowing = $updated->borrowing;
            $borrowing->update(['due_date' => $updated->requested_due_date]);

            $fresh = $updated->fresh(['borrowing.user', 'borrowing.asset', 'reviewer']);

            // Notify the borrower
            $assetName = $fresh->borrowing?->asset?->name ?? 'an asset';
            $this->notificationService->notifyUser(
                $fresh->borrowing->user_id,
                'Extension Approved',
                "Your extension request for {$assetName} has been approved. New due date: {$fresh->requested_due_date}.",
                'extension_approved',
                $fresh->id,
                BorrowExtensionRequest::class,
                ['link' => '/borrowings'],
            );

            return $fresh;
        });
    }

    public function reject(User $reviewer, BorrowExtensionRequest $request, string $remarks = null): BorrowExtensionRequest
    {
        if ($request->status !== ExtensionRequestStatus::PENDING) {
            throw new \InvalidArgumentException('Only pending extension requests can be rejected.');
        }

        return DB::transaction(function () use ($reviewer, $request, $remarks) {
            $updated = $this->repository->update($request->id, [
                'status' => ExtensionRequestStatus::REJECTED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'remarks' => $remarks,
            ]);

            $fresh = $updated->fresh(['borrowing.user', 'borrowing.asset', 'reviewer']);

            // Notify the borrower
            $assetName = $fresh->borrowing?->asset?->name ?? 'an asset';
            $this->notificationService->notifyUser(
                $fresh->borrowing->user_id,
                'Extension Rejected',
                "Your extension request for {$assetName} has been rejected." . ($remarks ? " Reason: {$remarks}" : ''),
                'extension_rejected',
                $fresh->id,
                BorrowExtensionRequest::class,
                ['link' => '/borrowings'],
            );

            return $fresh;
        });
    }

    public function canManageExtensions(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::INVENTORY_OFFICER->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}