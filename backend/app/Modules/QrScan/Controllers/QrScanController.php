<?php

namespace App\Modules\QrScan\Controllers;

use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\QrScan\Services\QrScanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class QrScanController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly QrScanService $qrScanService) {}

    /**
     * GET /api/v1/qr/asset/{identifier}
     * Resolve a PSA QR identifier to full asset context.
     */
    public function resolveAsset(Request $request, string $identifier): JsonResponse
    {
        $identifier = trim(urldecode($identifier));

        if ($identifier === '') {
            return $this->error('QR identifier is required.', null, 422);
        }

        $context = $this->qrScanService->resolveAsset($identifier, $request->user());

        if (isset($context['error'])) {
            $status = match ($context['error']) {
                'not_found' => 404,
                'archived'  => 410,
                default     => 422,
            };

            return $this->error($context['message'], null, $status);
        }

        // Record the VIEW scan asynchronously (find asset from context)
        $assetId = $context['asset']['id'] ?? null;
        if ($assetId) {
            $asset = Asset::find($assetId);
            if ($asset) {
                $this->qrScanService->recordScan($asset, $request->user(), 'VIEW', $request);
            }
        }

        return $this->success($context, 'Asset context resolved successfully.');
    }

    /**
     * POST /api/v1/qr/scan-action
     * Record a non-VIEW scan action (e.g. BORROW_REQUESTED, DAMAGE_REPORTED).
     */
    public function recordAction(Request $request): JsonResponse
    {
        $request->validate([
            'asset_id'        => ['required', 'integer', 'exists:assets,id'],
            'action_performed' => ['required', 'string', 'max:100'],
        ]);

        $asset = Asset::findOrFail($request->input('asset_id'));
        $this->qrScanService->recordScan($asset, $request->user(), $request->input('action_performed'), $request);

        return $this->success(null, 'Scan action recorded.');
    }

    /**
     * GET /api/v1/qr/history
     * Admin/Custodian: paginated scan history.
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->qrScanService->listHistory($request->query());

        return $this->success([
            'items' => $history->items(),
            'meta'  => [
                'current_page' => $history->currentPage(),
                'per_page'     => $history->perPage(),
                'total'        => $history->total(),
                'last_page'    => $history->lastPage(),
            ],
        ], 'Scan history retrieved successfully.');
    }

    /**
     * GET /api/v1/qr/my-history
     * Employee: own scan history.
     */
    public function myHistory(Request $request): JsonResponse
    {
        $history = $this->qrScanService->myHistory($request->user(), $request->query());

        return $this->success([
            'items' => $history->items(),
            'meta'  => [
                'current_page' => $history->currentPage(),
                'per_page'     => $history->perPage(),
                'total'        => $history->total(),
                'last_page'    => $history->lastPage(),
            ],
        ], 'Your scan history retrieved successfully.');
    }
}
