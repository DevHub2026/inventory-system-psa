<?php

namespace App\Modules\Notification\Controllers;

use App\Models\Notification;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $notifications = $this->notificationService->listForUser($request->user(), $perPage);

        return $this->success([
            'items' => collect($notifications->items())
                ->map(fn (Notification $n) => $this->notificationService->transform($n))
                ->values(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
                'unread_count' => $this->notificationService->unreadCount($request->user()),
            ],
        ], 'Notifications retrieved successfully.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return $this->success([
            'unread_count' => $this->notificationService->unreadCount($request->user()),
        ], 'Unread notification count retrieved successfully.');
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($notification, $request->user());

        return $this->success(
            $this->notificationService->transform($notification),
            'Notification marked as read.',
        );
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = $this->notificationService->markAllAsRead($request->user());

        return $this->success([
            'updated' => $updated,
            'unread_count' => 0,
        ], 'All notifications marked as read.');
    }
}
