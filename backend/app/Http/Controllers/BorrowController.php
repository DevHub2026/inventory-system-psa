<?php

namespace App\Http\Controllers;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Services\BorrowingService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

/**
 * Legacy BorrowController — delegates to the canonical BorrowingService.
 *
 * Keep this controller for backwards compatibility with the frontend
 * assetService.borrow() / assetService.returnAsset() calls.
 */
class BorrowController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly BorrowingService $borrowingService) {}

    public function borrow(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('borrow', $asset);

        $user = Auth::user();

        $dueDate = $request->input('due_date')
            ? now()->addDays((int) $request->input('due_date'))->toDateString()
            : now()->addDays(7)->toDateString();

        $borrowing = $this->borrowingService->create($user, [
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'remarks' => $request->input('notes'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset borrowed successfully.',
            'data' => [
                'id' => $borrowing->id,
                'user_id' => $borrowing->user_id,
                'asset_id' => $borrowing->asset_id,
                'asset_name' => $asset->name,
                'asset_number' => $asset->asset_number,
                'employee_name' => $user->full_name ?: $user->email,
                'status' => $borrowing->status,
                'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
                'due_date' => $borrowing->due_date?->format('Y-m-d'),
                'remarks' => $borrowing->remarks,
                'created_at' => $borrowing->created_at?->format('Y-m-d H:i:s'),
                'authorized_by' => $borrowing->authorized_by,
                'authorized_by_name' => $user->full_name ?: $user->email,
                'authorized_at' => $borrowing->authorized_at?->format('Y-m-d H:i:s'),
                'returned_at' => null,
                'receipt_code' => 'PSA-BOR-'.$borrowing->id,
                'receipt_payload' => 'PSA-BOR-'.$borrowing->id.'|'.$asset->asset_number.'|'.$user->id,
            ],
        ], 200);
    }

    public function return(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('return', $asset);

        $borrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->where('status', 'BORROWED')
            ->latest()
            ->first();

        if (! $borrowing) {
            return response()->json([
                'success' => false,
                'message' => 'No active borrow record found for this asset.',
            ], 400);
        }

        $borrowing = $this->borrowingService->return($borrowing);

        return response()->json([
            'success' => true,
            'message' => 'Asset returned successfully.',
            'data' => [
                'id' => $borrowing->id,
                'user_id' => $borrowing->user_id,
                'asset_id' => $borrowing->asset_id,
                'asset_name' => $borrowing->asset?->name,
                'asset_number' => $borrowing->asset?->asset_number,
                'employee_name' => $borrowing->user?->full_name ?: $borrowing->user?->email,
                'status' => $borrowing->status,
                'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
                'due_date' => $borrowing->due_date?->format('Y-m-d'),
                'returned_at' => $borrowing->returned_at?->format('Y-m-d H:i:s'),
                'remarks' => $request->input('notes', $borrowing->remarks),
                'created_at' => $borrowing->created_at?->format('Y-m-d H:i:s'),
                'receipt_code' => 'PSA-BOR-'.$borrowing->id,
                'receipt_payload' => 'PSA-BOR-'.$borrowing->id.'|'.$borrowing->asset?->asset_number.'|'.$borrowing->user_id,
            ],
        ], 200);
    }
}
