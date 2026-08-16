<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\AssetAttachment;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AssetAttachmentController extends Controller
{
    use AuthorizesRequests;
    use RespondsWithJson;

    public function index(Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $attachments = $asset->attachments()->with('uploader')->latest()->get();

        return $this->success($attachments->map(fn (AssetAttachment $attachment) => $this->transform($attachment))->values(), 'Asset attachments retrieved successfully.');
    }

    public function store(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,csv', 'max:10240'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $file = $validated['file'];
        $path = $file->store("asset-attachments/{$asset->id}", 'local');
        $mime = (string) $file->getMimeType();

        $attachment = AssetAttachment::query()->create([
            'asset_id' => $asset->id,
            'uploaded_by' => $request->user()?->id,
            'disk' => 'local',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'size' => $file->getSize(),
            'kind' => str_starts_with($mime, 'image/') ? 'image' : 'document',
            'description' => $validated['description'] ?? null,
        ]);

        return $this->success($this->transform($attachment->fresh('uploader')), 'Asset attachment uploaded successfully.', 201);
    }

    public function download(Asset $asset, AssetAttachment $attachment): BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $asset);
        $this->ensureAttachmentBelongsToAsset($asset, $attachment);

        if (! Storage::disk($attachment->disk)->exists($attachment->path)) {
            return $this->error('Attachment file was not found.', null, 404);
        }

        return response()->download(
            Storage::disk($attachment->disk)->path($attachment->path),
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type],
        );
    }

    public function destroy(Asset $asset, AssetAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $asset);
        $this->ensureAttachmentBelongsToAsset($asset, $attachment);

        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        return $this->success(null, 'Asset attachment deleted successfully.');
    }

    private function transform(AssetAttachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'asset_id' => $attachment->asset_id,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'size' => $attachment->size,
            'kind' => $attachment->kind,
            'description' => $attachment->description,
            'uploaded_by' => $attachment->uploader?->full_name ?: $attachment->uploader?->email,
            'created_at' => $attachment->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function ensureAttachmentBelongsToAsset(Asset $asset, AssetAttachment $attachment): void
    {
        abort_unless((int) $attachment->asset_id === (int) $asset->id, 404);
    }
}
