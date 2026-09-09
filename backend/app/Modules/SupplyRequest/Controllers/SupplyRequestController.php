<?php

namespace App\Modules\SupplyRequest\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use App\Modules\SupplyRequest\Requests\FulfillSupplyRequestRequest;
use App\Modules\SupplyRequest\Requests\StoreSupplyRequestRequest;
use App\Modules\SupplyRequest\Services\SupplyRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SupplyRequestController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly SupplyRequestService $supplyRequestService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SupplyRequest::class);
        
        $filters = $request->only(['status', 'workflow_status']);
        
        $perPage = (int) $request->input('per_page', 15);

        $requests = $this->supplyRequestService->list($filters, $perPage, $request->user());

        return $this->success($requests);
    }

    public function store(StoreSupplyRequestRequest $request): JsonResponse
    {
        $this->authorize('create', SupplyRequest::class);

        $supplyRequest = $this->supplyRequestService->create($request->user(), $request->validated());

        return $this->success($supplyRequest, 'Supply request submitted successfully.', 201);
    }

    public function show(Request $request, SupplyRequest $supplyRequest): JsonResponse
    {
        $this->authorize('view', $supplyRequest);

        $supplyRequest->load(['user', 'office', 'fulfiller', 'items.inventoryItem.unit']);

        return $this->success($supplyRequest);
    }

    public function approve(Request $request, SupplyRequest $supplyRequest): JsonResponse
    {
        // Workflow approval is generally authorized inside the workflow engine level,
        // but we'll ensure they are authenticated.
        $result = $this->supplyRequestService->approve($supplyRequest, $request->user(), $request->input('remarks'));

        return $this->success($result, 'Supply request approved.');
    }

    public function reject(Request $request, SupplyRequest $supplyRequest): JsonResponse
    {
        $result = $this->supplyRequestService->reject($supplyRequest, $request->user(), $request->input('remarks'));

        return $this->success($result, 'Supply request rejected.');
    }

    public function cancel(Request $request, SupplyRequest $supplyRequest): JsonResponse
    {
        if ($request->user()->id !== $supplyRequest->user_id && !$request->user()->hasPermission('supply_requests.fulfill')) {
            abort(403, 'Unauthorized to cancel this request.');
        }

        $result = $this->supplyRequestService->cancel($supplyRequest, $request->user(), $request->input('remarks'));

        return $this->success($result, 'Supply request cancelled.');
    }

    public function fulfill(FulfillSupplyRequestRequest $request, SupplyRequest $supplyRequest): JsonResponse
    {
        $this->authorize('fulfill', $supplyRequest);

        $result = $this->supplyRequestService->fulfill($supplyRequest, $request->input('items'), $request->user());

        return $this->success($result, 'Supply request fulfilled.');
    }
}

