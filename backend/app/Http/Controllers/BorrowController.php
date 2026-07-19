<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BorrowController extends Controller
{
    public function borrow(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('borrow', $asset);

        if ($asset->status !== AssetStatus::AVAILABLE) {
            throw new AssetNotAvailableException('Asset is not available for borrowing.');
        }

        $user = Auth::user();

        $dueDate = $request->input('due_date')
            ? now()->addDays((int) $request->input('due_date'))->toDateString()
            : now()->addDays(7)->toDateString();

        $borrowing = Borrowing::create([
            'asset_id' => $asset->id,
            'user_id' => $user->id,
            'borrow_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'status' => 'BORROWED',
            'remarks' => $request->input('notes'),
            'authorized_by' => $user->id,
            'authorized_at' => now(),
        ]);

        $asset->update(['status' => AssetStatus::BORROWED]);

        $admin = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Super Administrator', 'System Administrator', 'Property Custodian']);
        })->first();

        if ($admin) {
            try {
                $admin->notify(new \App\Notifications\BorrowNotification($borrowing, $user, $asset));
            } catch (\Throwable $exception) {
                Log::warning('Borrow notification could not be sent.', [
                    'borrowing_id' => $borrowing->id,
                    'asset_id' => $asset->id,
                    'user_id' => $user->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

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

        $borrowing->update([
            'status' => 'RETURNED',
            'remarks' => $request->input('notes', $borrowing->remarks),
        ]);

        $asset->update(['status' => AssetStatus::AVAILABLE]);

        return response()->json([
            'success' => true,
            'message' => 'Asset returned successfully.',
            'data' => [
                'borrowing' => $borrowing,
                'asset' => $asset,
            ],
        ], 200);
    }
}
