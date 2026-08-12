<?php

namespace App\Modules\Reservation\Controllers;

use App\Enums\UserRole;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\Reservation\Requests\StoreReservationRequest;
use App\Modules\Reservation\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReservationController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly ReservationService $reservationService) {}

    private function transform(Reservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'employee_name' => $reservation->user?->full_name ?: $reservation->user?->email,
            'employee_id' => $reservation->user?->employee_number ?? null,
            'status' => $reservation->status,
            'start_date' => $reservation->start_date?->format('Y-m-d'),
            'end_date' => $reservation->end_date?->format('Y-m-d'),
            'remarks' => $reservation->remarks,
            'created_at' => $reservation->created_at?->format('Y-m-d H:i:s'),
            'authorized_by' => $reservation->authorized_by,
            'authorized_by_name' => $reservation->authorizer?->full_name ?: $reservation->authorizer?->email,
            'authorized_at' => $reservation->authorized_at?->format('Y-m-d H:i:s'),
            'asset_ids' => $reservation->assets->pluck('id')->values(),
            'asset_names' => $reservation->assets->pluck('name')->values(),
            'asset_numbers' => $reservation->assets->pluck('asset_number')->values(),
            'receipt_code' => 'PSA-RES-'.$reservation->id,
            'receipt_payload' => 'PSA-RES-'.$reservation->id.'|'.$reservation->assets->pluck('asset_number')->join(',').'|'.$reservation->user_id,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $reservations = $this->reservationService->list($request->user(), $perPage);

        return $this->success([
            'items' => collect($reservations->items())->map(fn (Reservation $r) => $this->transform($r))->values(),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'per_page' => $reservations->perPage(),
                'total' => $reservations->total(),
                'last_page' => $reservations->lastPage(),
            ],
            'links' => [
                'first' => $reservations->url(1),
                'last' => $reservations->url($reservations->lastPage()),
                'prev' => $reservations->previousPageUrl(),
                'next' => $reservations->nextPageUrl(),
            ],
        ], 'Reservations retrieved successfully.');
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        try {
            $reservation = $this->reservationService->create($request->user(), $request->validated());

            return $this->success(
                $this->transform($reservation),
                'Reservation created successfully.',
                201,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function approve(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can approve reservations.');

        $result = $this->reservationService->approve($reservation, $request->user());

        return $this->success(
            array_merge(
                $this->transform($result['reservation']),
                [
                    'auto_released' => $result['auto_released'],
                    'borrowing_ids' => $result['borrowing_ids'],
                ],
            ),
            $result['auto_released']
                ? 'Borrow request approved and asset released successfully.'
                : 'Reservation approved successfully.',
        );
    }

    public function reject(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can reject reservations.');

        $reservation = $this->reservationService->reject(
            $reservation,
            $request->user(),
            $request->input('remarks'),
        );

        return $this->success(
            $this->transform($reservation),
            'Reservation rejected successfully.',
        );
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        $reservation = $this->reservationService->cancel($reservation, $request->user());

        return $this->success(
            $this->transform($reservation),
            'Reservation cancelled successfully.',
        );
    }

    public function release(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can release reservations.');

        $borrowing = $this->reservationService->release($reservation, $request->user(), $request->input('asset_id'));

        return $this->success(
            [
                'reservation' => $this->transform($reservation->fresh()->load(['user', 'assets', 'authorizer'])),
                'borrowing' => $this->transformBorrowing($borrowing),
            ],
            'Asset released successfully.',
        );
    }

    public function scanAuthorize(Request $request): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can approve reservations.');

        $value = trim((string) $request->input('value', ''));
        abort_if($value === '', 422, 'Identifier value is required.');

        $result = $this->reservationService->authorizeByScan($request->user(), $value);

        return $this->success(
            array_merge(
                $this->transform($result['reservation']),
                [
                    'auto_released' => $result['auto_released'],
                    'borrowing_ids' => $result['borrowing_ids'],
                ],
            ),
            $result['auto_released']
                ? 'Borrow request approved and asset released successfully.'
                : 'Borrow request authorized successfully.',
        );
    }

    private function transformBorrowing(
        \App\Modules\Borrowing\Models\Borrowing $borrowing
    ): array
    {
        $isReturned = $borrowing->status === 'RETURNED';
        $receiptPrefix = $isReturned ? 'RT' : 'BR';

        return [
            'id' => $borrowing->id,
            'user_id' => $borrowing->user_id,
            'asset_id' => $borrowing->asset_id,
            'status' => $borrowing->status,
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'borrowed_at' => $borrowing->borrowed_at?->format('Y-m-d H:i:s'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'returned_at' => $borrowing->returned_at?->format('Y-m-d H:i:s'),
            'remarks' => $borrowing->remarks,
            'authorized_by' => $borrowing->authorized_by,
            'authorized_by_name' => $borrowing->authorizer?->full_name ?? $borrowing->authorizer?->email,
            'authorized_at' => $borrowing->authorized_at?->format('Y-m-d H:i:s'),
            'asset_name' => $borrowing->asset?->name,
            'asset_number' => $borrowing->asset?->asset_number,
            'receipt_code' => $receiptPrefix.'-'.str_pad((string) $borrowing->id, 5, '0', STR_PAD_LEFT),
            'receipt_payload' => $receiptPrefix.'-'.str_pad((string) $borrowing->id, 5, '0', STR_PAD_LEFT)."|".($borrowing->asset?->asset_number ?? '')."|".$borrowing->user_id,
        ];
    }

    private function canApproveReservations($user): bool
    {
        return $user?->hasRole(UserRole::SUPER_ADMINISTRATOR->value) === true
            || $user?->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value) === true
            || $user?->hasRole(UserRole::PROPERTY_CUSTODIAN->value) === true
            || $user?->hasRole(UserRole::INVENTORY_OFFICER->value) === true
            || $user?->hasRole(UserRole::DEPARTMENT_HEAD->value) === true;
    }
}
