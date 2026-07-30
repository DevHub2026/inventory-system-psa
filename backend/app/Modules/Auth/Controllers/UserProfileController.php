<?php

namespace App\Modules\Auth\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class UserProfileController extends Controller
{
    use RespondsWithJson;

    // ---------------------------------------------------------------------------
    // Authorization helpers
    // ---------------------------------------------------------------------------

    /**
     * Determine whether the authenticated user may view another user's profile.
     *
     * Rules:
     *  - Admins and authorised staff can view any profile.
     *  - Everyone else can only view their own profile.
     */
    private function canViewProfile(User $actor, User $subject): bool
    {
        if ($actor->id === $subject->id) {
            return true;
        }

        return $actor->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $actor->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $actor->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $actor->hasRole(UserRole::INVENTORY_OFFICER->value)
            || $actor->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }

    // ---------------------------------------------------------------------------
    // Endpoints
    // ---------------------------------------------------------------------------

    /**
     * GET /api/v1/users/{user}/profile
     *
     * Returns full user info + borrow statistics.
     */
    public function profile(Request $request, User $user): JsonResponse
    {
        abort_unless($this->canViewProfile($request->user(), $user), 403, 'You are not authorised to view this profile.');

        $user->loadMissing(['department', 'office', 'roles']);

        // ── Statistics ──────────────────────────────────────────────────────────
        $stats = $this->buildStats($user);

        return $this->success([
            'user' => [
                'id'              => $user->id,
                'employee_number' => $user->employee_number,
                'username'        => $user->username,
                'first_name'      => $user->first_name,
                'middle_name'     => $user->middle_name,
                'last_name'       => $user->last_name,
                'full_name'       => $user->full_name,
                'email'           => $user->email,
                'status'          => $user->status,
                'created_at'      => $user->created_at?->format('Y-m-d H:i:s'),
                'department'      => $user->department ? [
                    'id'   => $user->department->id,
                    'name' => $user->department->name,
                ] : null,
                'office' => $user->office ? [
                    'id'   => $user->office->id,
                    'name' => $user->office->name,
                ] : null,
                'roles' => $user->roles->map(fn ($r) => [
                    'id'   => $r->id,
                    'name' => $r->name,
                ])->values(),
            ],
            'stats' => $stats,
        ], 'User profile retrieved successfully.');
    }

    /**
     * GET /api/v1/users/{user}/issued-assets
     *
     * Returns assets currently issued (status = BORROWED / OVERDUE) to this user.
     */
    public function issuedAssets(Request $request, User $user): JsonResponse
    {
        abort_unless($this->canViewProfile($request->user(), $user), 403, 'You are not authorised to view this profile.');

        $borrowings = Borrowing::query()
            ->with(['asset.category', 'asset.location', 'asset.identifiers', 'authorizer'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['BORROWED', 'OVERDUE'])
            ->orderByDesc('borrowed_at')
            ->get();

        $items = $borrowings->map(fn (Borrowing $b) => $this->transformBorrowing($b, detailed: true));

        return $this->success(
            ['items' => $items],
            'Issued assets retrieved successfully.',
        );
    }

    /**
     * GET /api/v1/users/{user}/borrowing-history
     *
     * Returns the user's full borrowing history with pagination, search, and
     * status / date filters.
     */
    public function borrowingHistory(Request $request, User $user): JsonResponse
    {
        abort_unless($this->canViewProfile($request->user(), $user), 403, 'You are not authorised to view this profile.');

        $query = Borrowing::query()
            ->with(['asset.category', 'authorizer'])
            ->where('user_id', $user->id);

        // ── Search ───────────────────────────────────────────────────────────
        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->whereHas('asset', fn ($a) => $a->where('name', 'like', $like)->orWhere('asset_number', 'like', $like))
                  ->orWhereHas('asset.identifiers', fn ($ai) => $ai->where('identifier_value', 'like', $like));
            });
        }

        // ── Status filter ────────────────────────────────────────────────────
        if ($status = strtoupper(trim((string) $request->query('status', '')))) {
            if ($status !== '') {
                $query->where('status', $status);
            }
        }

        // ── Date range ───────────────────────────────────────────────────────
        if ($from = $request->query('date_from')) {
            $query->whereDate('borrowed_at', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('borrowed_at', '<=', $to);
        }

        $query->orderByDesc('borrowed_at')->orderByDesc('id');

        $perPage  = max(1, min(50, (int) $request->query('per_page', 15)));
        $paginator = $query->paginate($perPage);

        return $this->success([
            'items' => collect($paginator->items())->map(fn (Borrowing $b) => $this->transformBorrowing($b)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Borrowing history retrieved successfully.');
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private function buildStats(User $user): array
    {
        $base = Borrowing::query()->where('user_id', $user->id);

        return [
            'currently_borrowed' => (clone $base)->whereIn('status', ['BORROWED', 'OVERDUE'])->count(),
            'total_borrowed'     => (clone $base)->count(),
            'returned'           => (clone $base)->where('status', 'RETURNED')->count(),
            'overdue'            => (clone $base)->where('status', 'OVERDUE')->count(),
            'pending_requests'   => \App\Modules\Reservation\Models\Reservation::query()
                ->where('user_id', $user->id)
                ->where('status', 'PENDING')
                ->count(),
        ];
    }

    private function transformBorrowing(Borrowing $b, bool $detailed = false): array
    {
        $base = [
            'id'               => $b->id,
            'asset_id'         => $b->asset_id,
            'asset_name'       => $b->asset?->name,
            'asset_number'     => $b->asset?->asset_number,
            'asset_code'       => $b->asset?->asset_number,
            'category'         => $b->asset?->category?->name,
            'status'           => $b->status,
            'borrowed_at'      => $b->borrowed_at?->format('Y-m-d H:i:s'),
            'borrow_date'      => $b->borrow_date?->format('Y-m-d'),
            'due_date'         => $b->due_date?->format('Y-m-d'),
            'returned_at'      => $b->returned_at?->format('Y-m-d H:i:s'),
            'remarks'          => $b->remarks,
            'authorized_by'    => $b->authorized_by,
            'issued_by'        => $b->authorizer?->full_name ?: $b->authorizer?->email,
            'authorized_at'    => $b->authorized_at?->format('Y-m-d H:i:s'),
        ];

        if ($detailed) {
            // Extra fields only needed for the "currently issued" tab
            $serialIdentifier = $b->asset?->identifiers
                ?->firstWhere('identifier_type', 'SERIAL_NUMBER')
                ?->identifier_value;

            $base['serial_number'] = $serialIdentifier;
            $base['location']      = $b->asset?->location?->name ?? $b->asset?->office?->name;
        }

        return $base;
    }
}
