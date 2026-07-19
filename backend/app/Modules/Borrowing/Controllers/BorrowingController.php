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

    private function transform(Borrowing $borrowing): array
    {
        return [
            'id' => $borrowing->id,
            'user_id' => $borrowing->user_id,
            'employee_name' => $borrowing->user?->full_name ?: $borrowing->user?->email,
            'asset_id' => $borrowing->asset_id,
            'asset_name' => $borrowing->asset?->name,
            'asset_number' => $borrowing->asset?->asset_number,
            'status' => $borrowing->status,
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'remarks' => $borrowing->remarks,
            'created_at' => $borrowing->created_at?->format('Y-m-d H:i:s'),
            'authorized_by' => $borrowing->authorized_by,
            'authorized_by_name' => $borrowing->authorizer?->full_name ?: $borrowing->authorizer?->email,
            'authorized_at' => $borrowing->authorized_at?->format('Y-m-d H:i:s'),
            'receipt_code' => 'PSA-BOR-'.$borrowing->id,
            'receipt_payload' => 'PSA-BOR-'.$borrowing->id.'|'.$borrowing->asset?->asset_number.'|'.$borrowing->user_id,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $borrowings = $this->borrowingService->list($request->user());

        return $this->success(
            $borrowings->map(fn (Borrowing $borrowing) => $this->transform($borrowing))->values(),
            'Borrowings retrieved successfully.',
        );
    }

    public function store(StoreBorrowingRequest $request): JsonResponse
    {
        $borrowing = $this->borrowingService->create($request->user(), $request->validated());

        return $this->success(
            $this->transform($borrowing),
            'Borrowing created successfully.',
            201,
        );
    }

    public function return(Borrowing $borrowing): JsonResponse
    {
        $borrowing = $this->borrowingService->return($borrowing);

        return $this->success(
            $this->transform($borrowing),
            'Borrowing returned successfully.',
        );
    }
}
