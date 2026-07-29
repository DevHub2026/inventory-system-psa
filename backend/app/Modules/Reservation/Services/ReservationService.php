<?php

namespace App\Modules\Reservation\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use App\Modules\Notification\Services\NotificationService;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function __construct(
        private readonly AssetIdentifierService $assetIdentifierService,
        private readonly NotificationService $notificationService,
        private readonly \App\Modules\Workflow\Services\WorkflowEngineService $workflowEngineService,
    ) {}

    public function list(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return Reservation::query()
            ->with(['user', 'assets', 'authorizer'])
            ->when(! $this->canViewAllReservations($user), fn ($query) => $query->where('user_id', $user->id))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function create(User $user, array $data): Reservation
    {
        return DB::transaction(function () use ($user, $data) {
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'status' => 'PENDING',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            $reservation->assets()->sync($data['asset_ids']);
            $reservation->assets()->update(['status' => AssetStatus::RESERVED->value]);

            $reservation = $reservation->load(['user', 'assets']);

            // Start Workflow Engine
            $this->workflowEngineService->startWorkflow($reservation, 'borrow_request', $user, $data['remarks'] ?? null);

            $assetNames = $reservation->assets->pluck('name')->filter()->join(', ') ?: 'asset(s)';
            $requester = ($user->full_name ?: $user->email) ?? 'An employee';

            $this->notificationService->notifyStaffAndAdmins(
                'New Borrow Request',
                "{$requester} submitted a borrow request for {$assetNames}.",
                'borrow_request',
                $reservation->id,
                Reservation::class,
                ['link' => '/reservations'],
            );

            return $reservation->fresh();
        });
    }

    public function approve(Reservation $reservation, User $authorizer, ?string $remarks = null): Reservation
    {
        return DB::transaction(function () use ($reservation, $authorizer, $remarks) {
            $reservation = Reservation::query()
                ->with(['user', 'assets'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status !== 'PENDING') {
                throw new \InvalidArgumentException('Borrow request is already authorized or completed.');
            }


            // Execute Workflow Engine Approval Step
            $reservation = $this->workflowEngineService->approveCurrentLevel($reservation, $authorizer, $remarks);

            // If workflow is fully approved, transition main reservation status
            if ($reservation->workflow_status === 'APPROVED') {
                $reservation->update([
                    'status' => 'APPROVED',
                    'authorized_by' => $authorizer->id,
                    'authorized_at' => now(),
                ]);

                $reservation->assets()->update(['status' => AssetStatus::AVAILABLE->value]);

                if ($reservation->user_id) {
                    $this->notificationService->notifyUser(
                        $reservation->user_id,
                        'Borrow Request Approved',
                        'Your borrow request #'.$reservation->id.' has been approved.',
                        'request_approved',
                        $reservation->id,
                        Reservation::class,
                        ['link' => '/reservations'],
                    );
                }
            }

            return $reservation->fresh()->load(['user', 'assets', 'authorizer']);
        });
    }

    public function reject(Reservation $reservation, User $authorizer, ?string $remarks = null): Reservation
    {
        return DB::transaction(function () use ($reservation, $authorizer, $remarks) {
            $reservation = Reservation::query()
                ->with(['user', 'assets'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status !== 'PENDING') {
                throw new \InvalidArgumentException('Only pending borrow requests can be rejected.');
            }

            $reservation = $this->workflowEngineService->rejectCurrentLevel($reservation, $authorizer, $remarks);

            $reservation->update([
                'status' => 'REJECTED',
                'authorized_by' => $authorizer->id,
                'authorized_at' => now(),
                'remarks' => $remarks ?? $reservation->remarks,
            ]);

            $reservation->assets()->update(['status' => AssetStatus::AVAILABLE->value]);

            $fresh = $reservation->fresh()->load(['user', 'assets', 'authorizer']);

            if ($fresh->user_id) {
                $this->notificationService->notifyUser(
                    $fresh->user_id,
                    'Borrow Request Rejected',
                    'Your borrow request #'.$fresh->id.' has been rejected.',
                    'request_rejected',
                    $fresh->id,
                    Reservation::class,
                    ['link' => '/reservations'],
                );
            }

            return $fresh;
        });
    }

    public function cancel(Reservation $reservation, User $actor): Reservation
    {
        return DB::transaction(function () use ($reservation, $actor) {
            $reservation = Reservation::query()
                ->with(['user', 'assets'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status !== 'PENDING') {
                throw new \InvalidArgumentException('Only pending borrow requests can be cancelled.');
            }

            if ($reservation->user_id !== $actor->id && ! $this->canViewAllReservations($actor)) {
                throw new \InvalidArgumentException('You are not authorized to cancel this borrow request.');
            }

            $reservation = $this->workflowEngineService->cancelRequest($reservation, $actor, 'User cancelled borrow request');

            $reservation->update(['status' => 'CANCELLED']);
            $reservation->assets()->update(['status' => AssetStatus::AVAILABLE->value]);

            return $reservation->fresh()->load(['user', 'assets', 'authorizer']);
        });
    }

    public function authorizeByScan(User $authorizer, string $value): Reservation
    {
        return DB::transaction(function () use ($authorizer, $value) {
            $reservation = $this->reservationFromScanValue($value);

            if (! $reservation) {
                throw new \InvalidArgumentException('No pending borrow request found for this QR code.');
            }

            return $this->approve($reservation, $authorizer);
        });
    }

    private function reservationFromScanValue(string $value): ?Reservation
    {
        $value = trim($value);
        $reference = strtok($value, '|') ?: $value;

        if (str_starts_with($reference, 'PSA-RES-')) {
            $reservationId = (int) substr($reference, strlen('PSA-RES-'));

            return $reservationId > 0 ? Reservation::query()->find($reservationId) : null;
        }

        $asset = $this->assetIdentifierService->findByValue($value)?->asset;

        if (! $asset) {
            return null;
        }

        return Reservation::query()
            ->where('status', 'PENDING')
            ->whereHas('assets', fn ($query) => $query->where('assets.id', $asset->id))
            ->orderBy('created_at')
            ->first();
    }

    private function canViewAllReservations(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}
