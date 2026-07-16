<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Borrow;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BorrowController extends Controller
{
    public function borrow(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('borrow', $asset);

        if ($asset->status !== AssetStatus::AVAILABLE) {
            throw new AssetNotAvailableException('Asset is not available for borrowing.');
        }

        $user = Auth::user();

        $borrow = Borrow::create([
            'asset_id' => $asset->id,
            'user_id' => $user->id,
            'borrowed_at' => now(),
            'due_date' => $request->input('due_date') ? now()->addDays($request->input('due_date')) : null,
            'notes' => $request->input('notes'),
        ]);

        $asset->update(['status' => AssetStatus::BORROWED]);

        // Send notification to admin
        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if ($admin) {
            $admin->notify(new \App\Notifications\BorrowNotification($borrow, $user, $asset));
        }

        return response()->json([
            'success' => true,
            'message' => 'Asset borrowed successfully.',
            'data' => [
                'borrow' => $borrow,
                'asset' => $asset,
            ],
        ], 200);
    }

    public function return(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('return', $asset);

        $borrow = $asset->borrows()->whereNull('returned_at')->latest()->first();

        if (!$borrow) {
            return response()->json([
                'success' => false,
                'message' => 'No active borrow record found for this asset.',
            ], 400);
        }

        $borrow->update([
            'returned_at' => now(),
            'notes' => $request->input('notes', $borrow->notes),
        ]);

        $asset->update(['status' => AssetStatus::AVAILABLE]);

        return response()->json([
            'success' => true,
            'message' => 'Asset returned successfully.',
            'data' => [
                'borrow' => $borrow,
                'asset' => $asset,
            ],
        ], 200);
    }
}
