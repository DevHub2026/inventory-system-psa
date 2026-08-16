<?php

namespace App\Modules\Notification\Services;

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Create an in-app notification for a user, skipping near-duplicate unread rows.
     */
    public function notifyUser(
        int $userId,
        string $title,
        string $message,
        string $type,
        ?int $relatedId = null,
        ?string $relatedType = null,
        ?array $data = null,
    ): ?Notification {
        if ($this->hasRecentDuplicate($userId, $type, $relatedId, $relatedType)) {
            return null;
        }

        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
            'related_id' => $relatedId,
            'related_type' => $relatedType,
            'data' => $data,
        ]);
    }

    /**
     * Notify every active admin/staff user (distinct).
     */
    public function notifyStaffAndAdmins(
        string $title,
        string $message,
        string $type,
        ?int $relatedId = null,
        ?string $relatedType = null,
        ?array $data = null,
    ): void {
        $roles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
        ];

        User::query()
            ->where('status', 'active')
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $roles))
            ->pluck('id')
            ->unique()
            ->each(function (int $userId) use ($title, $message, $type, $relatedId, $relatedType, $data): void {
                $this->notifyUser($userId, $title, $message, $type, $relatedId, $relatedType, $data);
            });
    }

    public function listForUser(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(min(max($perPage, 1), 50));
    }

    public function unreadCount(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->unread()
            ->count();
    }

    public function markAsRead(Notification $notification, User $user): Notification
    {
        abort_unless($notification->user_id === $user->id, 403, 'You cannot modify this notification.');

        if (! $notification->is_read) {
            $notification->markAsRead();
        }

        return $notification->fresh();
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public function transform(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'is_read' => (bool) $notification->is_read,
            'read_at' => $notification->read_at?->format('Y-m-d H:i:s'),
            'related_id' => $notification->related_id,
            'related_type' => $notification->related_type,
            'data' => $notification->data,
            'link' => $this->resolveLink($notification),
            'created_at' => $notification->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function hasRecentDuplicate(
        int $userId,
        string $type,
        ?int $relatedId,
        ?string $relatedType,
    ): bool {
        $query = Notification::query()
            ->where('user_id', $userId)
            ->where('type', $type)
            ->where('is_read', false);

        if ($relatedId !== null) {
            $query->where('related_id', $relatedId);
        } else {
            $query->whereNull('related_id');
        }

        if ($relatedType !== null) {
            $query->where('related_type', $relatedType);
        } else {
            $query->whereNull('related_type');
        }

        // Prefer a single unread notification per event key; also block rapid re-creates.
        return $query->where('created_at', '>=', now()->subDay())->exists();
    }

    private function resolveLink(Notification $notification): ?string
    {
        return match ($notification->type) {
            'borrow_request',
            'reservation_request',
            'request_approved',
            'request_rejected' => '/reservations',
            'asset_returned',
            'borrowing_confirmed' => '/borrowings',
            'maintenance_update',
            'maintenance_reminder',
            'maintenance_overdue' => '/maintenance',
            'inventory_low_stock',
            'inventory_out_of_stock' => '/inventory',
            default => $notification->data['link'] ?? null,
        };
    }
}
