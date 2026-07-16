<?php

namespace App\Modules\Reservation\Controllers;

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

    public function index(Request $request): JsonResponse
    {
        $reservations = $this->reservationService->list($request->user(), $request->all());

        return $this->success($reservations->map(fn (Reservation $reservation) => [
            'id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'status' => $reservation->status,
            'start_date' => $reservation->start_date?->format('Y-m-d'),
            'end_date' => $reservation->end_date?->format('Y-m-d'),
            'remarks' => $reservation->remarks,
            'asset_ids' => $reservation->assets()->pluck('assets.id'),
        ])->values(), 'Reservations retrieved successfully.');
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $reservation = $this->reservationService->create($request->user(), $request->validated());

        return $this->success([
            'id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'status' => $reservation->status,
            'start_date' => $reservation->start_date?->format('Y-m-d'),
            'end_date' => $reservation->end_date?->format('Y-m-d'),
            'remarks' => $reservation->remarks,
            'asset_ids' => $reservation->assets()->pluck('assets.id'),
        ], 'Reservation created successfully.', 201);
    }

    public function approve(Reservation $reservation): JsonResponse
    {
        $reservation = $this->reservationService->approve($reservation);

        return $this->success([
            'id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'status' => $reservation->status,
            'start_date' => $reservation->start_date?->format('Y-m-d'),
            'end_date' => $reservation->end_date?->format('Y-m-d'),
            'remarks' => $reservation->remarks,
            'asset_ids' => $reservation->assets()->pluck('assets.id'),
        ], 'Reservation approved successfully.');
    }
}
