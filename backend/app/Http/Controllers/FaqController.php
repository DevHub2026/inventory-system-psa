<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FaqController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $query = Faq::query()
            ->where('active', true)
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim($request->input('search'));
                $q->where(function ($inner) use ($search) {
                    $inner->whereRaw('LOWER(question) like ?', ['%'.Str::lower($search).'%'])
                        ->orWhereRaw('LOWER(answer) like ?', ['%'.Str::lower($search).'%'])
                        ->orWhereRaw('LOWER(category) like ?', ['%'.Str::lower($search).'%']);
                });
            })
            ->orderBy('created_at', 'desc');

        $items = $query->get()->filter(function (Faq $faq) use ($request): bool {
            return $this->isVisibleToUser($faq, $request->user());
        });

        return $this->success($items->map(fn (Faq $faq) => $this->transform($faq))->values());
    }

    /**
     * Admin-only listing: returns all FAQs regardless of active/role status.
     * Used by the FAQ Management page.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $this->authorize('create', Faq::class);

        $query = Faq::query()
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim($request->input('search'));
                $q->where(function ($inner) use ($search) {
                    $inner->whereRaw('LOWER(question) like ?', ['%'.Str::lower($search).'%'])
                        ->orWhereRaw('LOWER(answer) like ?', ['%'.Str::lower($search).'%'])
                        ->orWhereRaw('LOWER(category) like ?', ['%'.Str::lower($search).'%']);
                });
            })
            ->orderBy('created_at', 'desc');

        return $this->success($query->get()->map(fn (Faq $faq) => $this->transform($faq))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Faq::class);

        $data = $this->validatePayload($request, null);

        if ($this->questionExists($data['question'], null)) {
            return $this->error('A FAQ with this question already exists.', ['question' => ['A FAQ with this question already exists.']], 422);
        }

        $faq = Faq::query()->create($data);

        return $this->success($this->transform($faq), 'FAQ created successfully.', 201);
    }

    public function update(Request $request, Faq $faq): JsonResponse
    {
        $this->authorize('update', $faq);

        $data = $this->validatePayload($request, $faq);

        if ($this->questionExists($data['question'], $faq->id)) {
            return $this->error('A FAQ with this question already exists.', ['question' => ['A FAQ with this question already exists.']], 422);
        }

        $faq->update($data);

        return $this->success($this->transform($faq->fresh()), 'FAQ updated successfully.');
    }

    public function destroy(Request $request, Faq $faq): JsonResponse
    {
        $this->authorize('delete', $faq);

        $faq->delete();

        return $this->success(null, 'FAQ deleted successfully.');
    }

    private function validatePayload(Request $request, ?Faq $faq): array
    {
        $data = $request->validate([
            'question'          => ['required', 'string', 'min:3', 'max:255'],
            'answer'            => ['required', 'string', 'min:10'],
            'category'          => ['nullable', 'string', 'max:100'],
            'keywords'          => ['nullable', 'array'],
            'keywords.*'        => ['string', 'max:100'],
            'roles'             => ['nullable', 'array'],
            'roles.*'           => ['string', 'max:100'],
            'destination'       => ['nullable', 'string', 'max:255'],
            'actions'           => ['nullable', 'array'],
            'actions.*.label'   => ['nullable', 'string', 'max:100'],
            'actions.*.target'  => ['nullable', 'string', 'max:255'],
            'active'            => ['nullable', 'boolean'],
        ]);

        $question    = trim((string) ($data['question'] ?? ''));
        $answer      = trim((string) ($data['answer'] ?? ''));
        $destination = trim((string) ($data['destination'] ?? ''));
        $roles       = collect($data['roles'] ?? [])->map(fn ($role) => trim((string) $role))->filter()->values()->all();
        $keywords    = collect($data['keywords'] ?? [])->map(fn ($keyword) => trim((string) $keyword))->filter()->values()->all();
        $actions     = collect($data['actions'] ?? [])->map(function ($action) {
            if (! is_array($action)) {
                return null;
            }

            $label  = trim((string) ($action['label'] ?? ''));
            $target = trim((string) ($action['target'] ?? ''));

            if ($label === '' && $target === '') {
                return null;
            }

            return [
                'label'  => $label,
                'type'   => 'route',
                'target' => $target,
            ];
        })->filter()->values()->all();

        if ($destination === '' && count($actions) > 0) {
            $destination = $actions[0]['target'] ?? '';
        }

        return [
            'question'    => $question,
            'answer'      => $answer,
            'category'    => ! empty($data['category']) ? trim((string) $data['category']) : 'General',
            'keywords'    => $keywords,
            'roles'       => $roles,
            'destination' => $destination,
            'actions'     => $actions,
            'active'      => (bool) ($data['active'] ?? true),
        ];
    }

    private function questionExists(string $question, ?int $ignoreId): bool
    {
        $normalized = trim($question);

        if ($normalized === '') {
            return false;
        }

        return Faq::query()
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->whereRaw('LOWER(question) = ?', [Str::lower($normalized)])
            ->exists();
    }

    private function isVisibleToUser(Faq $faq, ?\Illuminate\Contracts\Auth\Authenticatable $user): bool
    {
        if (! $user) {
            return false;
        }

        $roleNames = $faq->roles ?? [];
        if (empty($roleNames)) {
            return true;
        }

        // Use a DB query to avoid eager-loading issues across request contexts.
        return $user->roles()->whereIn('name', $roleNames)->exists();
    }

    private function transform(Faq $faq): array
    {
        return [
            'id'          => $faq->id,
            'question'    => $faq->question,
            'answer'      => $faq->answer,
            'category'    => $faq->category ?: 'General',
            'keywords'    => $faq->keywords ?? [],
            'roles'       => $faq->roles ?? [],
            'destination' => $faq->destination,
            'actions'     => $faq->actions ?? [],
            'active'      => (bool) $faq->active,
            'published'   => (bool) $faq->active,
            'created_at'  => $faq->created_at?->toISOString(),
            'updated_at'  => $faq->updated_at?->toISOString(),
        ];
    }
}
