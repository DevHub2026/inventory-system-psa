<?php

namespace App\Modules\Borrowing\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Requests\StoreBorrowingRequest;
use App\Modules\Borrowing\Services\BorrowingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BorrowingController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly BorrowingService $borrowingService) {}

    public function index(Request $request): JsonResponse
    {
        $borrowings = $this->borrowingService->list($request->user());

        return $this->success($borrowings->map(fn (Borrowing $borrowing) => [
            'id' => $borrowing->id,
            'user_id' => $borrowing->user_id,
            'asset_id' => $borrowing->asset_id,
            'status' => $borrowing->status,
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'remarks' => $borrowing->remarks,
        ])->values(), 'Borrowings retrieved successfully.');
    }

    public function store(StoreBorrowingRequest $request): JsonResponse
    {
        $borrowing = $this->borrowingService->create($request->user(), $request->validated());

        return $this->success([
            'id' => $borrowing->id,
            'user_id' => $borrowing->user_id,
            'asset_id' => $borrowing->asset_id,
            'status' => $borrowing->status,
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'remarks' => $borrowing->remarks,
        ], 'Borrowing created successfully.', 201);
    }

    public function return(Borrowing $borrowing): JsonResponse
    {
        $borrowing = $this->borrowingService->return($borrowing);

        return $this->success([
            'id' => $borrowing->id,
            'user_id' => $borrowing->user_id,
            'asset_id' => $borrowing->asset_id,
            'status' => $borrowing->status,
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'remarks' => $borrowing->remarks,
        ], 'Borrowing returned successfully.');
    }
}
