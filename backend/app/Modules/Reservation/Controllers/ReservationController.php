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
        $reservation = $this->reservationService->create($request->user(), $request->validated());

        return $this->success(
            $this->transform($reservation),
            'Reservation created successfully.',
            201,
        );
    }

    public function approve(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can approve reservations.');

        $reservation = $this->reservationService->approve($reservation, $request->user());

        return $this->success(
            $this->transform($reservation),
            'Reservation approved successfully.',
        );
    }

    public function scanAuthorize(Request $request): JsonResponse
    {
        abort_unless($this->canApproveReservations($request->user()), 403, 'Only authorized staff can approve reservations.');

        $value = trim((string) $request->input('value', ''));
        abort_if($value === '', 422, 'Identifier value is required.');

        $reservation = $this->reservationService->authorizeByScan($request->user(), $value);

        return $this->success(
            $this->transform($reservation),
            'Borrow request authorized successfully.',
        );
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
