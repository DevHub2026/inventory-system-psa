<?php

namespace App\Modules\SystemSetup\Models;

use App\Models\User;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use App\Modules\SystemSetup\Enums\TemplateUsageContext;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'document_type',
        'usage_context',
        'description',
        'version',
        'status',
        'is_default',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'extension',
        'validation_status',
        'validation_result',
        'has_unknown_placeholders',
        'change_notes',
        'uploaded_by',
        'upload_date',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'file_size' => 'integer',
            'upload_date' => 'datetime',
            'status' => TemplateStatus::class,
            'document_type' => DocumentType::class,
            'usage_context' => TemplateUsageContext::class,
            'validation_result' => 'array',
            'has_unknown_placeholders' => 'boolean',
        ];
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentTemplateVersion::class)->orderByDesc('id');
    }

    public function generatedDocuments(): HasMany
    {
        return $this->hasMany(GeneratedDocument::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', TemplateStatus::ACTIVE->value);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForType($query, DocumentType|string $type)
    {
        $value = $type instanceof DocumentType ? $type->value : $type;

        return $query->where('document_type', $value);
    }

    public function scopeForUsageContext($query, TemplateUsageContext|string $context)
    {
        $value = $context instanceof TemplateUsageContext ? $context->value : $context;

        return $query->where('usage_context', $value);
    }

    /**
     * Default active template for spreadsheet exports (legacy path).
     */
    public static function getDefaultFor(DocumentType|string $type): ?self
    {
        $value = $type instanceof DocumentType ? $type->value : $type;

        return self::query()
            ->where('document_type', $value)
            ->where('status', TemplateStatus::ACTIVE->value)
            ->where('is_default', true)
            ->latest('updated_at')
            ->first();
    }

    /**
     * Resolve the best active DOCX template for a given usage_context key.
     *
     * Resolution order:
     *  1. Active DOCX template explicitly assigned to this usage_context,
     *     default first.
     *  2. Falls back to getActiveDocxFor($documentType) so existing templates
     *     that have no usage_context continue to work.
     */
    public static function getActiveDocxForContext(TemplateUsageContext|string $context): ?self
    {
        $ctxValue = $context instanceof TemplateUsageContext ? $context->value : $context;
        $ctx = $context instanceof TemplateUsageContext
            ? $context
            : TemplateUsageContext::tryFrom($ctxValue);

        $baseQuery = self::query()
            ->where('usage_context', $ctxValue)
            ->where('status', TemplateStatus::ACTIVE->value)
            ->where('extension', 'docx')
            ->whereNotNull('file_path')
            ->where('has_unknown_placeholders', false);

        $default = (clone $baseQuery)->where('is_default', true)->latest('updated_at')->first();
        if ($default) {
            return $default;
        }

        $any = $baseQuery->latest('updated_at')->first();
        if ($any) {
            return $any;
        }

        // Fallback: look for a template by document_type (backward compat for
        // templates that predate the usage_context column).
        if ($ctx !== null) {
            return self::getActiveDocxFor($ctx->documentType());
        }

        return null;
    }

    /**
     * Active DOCX template used for official document generation.
     */
    public static function getActiveDocxFor(DocumentType|string $type): ?self
    {
        $value = $type instanceof DocumentType ? $type->value : $type;

        if (! in_array($value, PlaceholderRegistry::officialDocumentTypes(), true)) {
            return null;
        }

        $query = self::query()
            ->where('document_type', $value)
            ->where('status', TemplateStatus::ACTIVE->value)
            ->where('extension', 'docx')
            ->whereNotNull('file_path')
            ->where('has_unknown_placeholders', false);

        $default = (clone $query)->where('is_default', true)->latest('updated_at')->first();
        if ($default) {
            return $default;
        }

        return $query->latest('updated_at')->first();
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status instanceof TemplateStatus
            ? $this->status->label()
            : ($this->status === TemplateStatus::ACTIVE->value ? 'Active' : 'Inactive');
    }

    public function isOfficialDocxType(): bool
    {
        $type = $this->document_type instanceof DocumentType
            ? $this->document_type->value
            : (string) $this->document_type;

        return in_array($type, PlaceholderRegistry::officialDocumentTypes(), true);
    }

    public function isDocxReady(): bool
    {
        return $this->extension === 'docx'
            && filled($this->file_path)
            && ! $this->has_unknown_placeholders
            && $this->validation_status === 'valid';
    }

    /**
     * File validation status.
     *
     * Values:
     *   'no_file'         — no file has been uploaded yet
     *   'valid'           — file is parseable with no unsupported placeholders
     *   'invalid'         — file has unsupported/unknown placeholders
     *   'not_validated'   — file exists but validation has not been run yet
     */
    public function getFileValidationStatus(): string
    {
        if (! filled($this->file_path)) {
            return 'no_file';
        }

        if ($this->extension !== 'docx') {
            // Non-DOCX files (xlsx etc.) cannot be placeholder-validated;
            // treat the file presence itself as the validation signal.
            return 'valid';
        }

        if ($this->validation_status === 'valid') {
            return 'valid';
        }

        if ($this->validation_status === 'invalid') {
            return 'invalid';
        }

        // File exists but validation has not been run.
        return 'not_validated';
    }

    /**
     * Placeholder status — separate from whether the file is structurally valid.
     *
     * Values:
     *   'not_applicable'      — not a DOCX template type that supports placeholders
     *   'no_file'             — no file uploaded yet
     *   'not_validated'       — file exists but scan has not run
     *   'no_placeholders'     — file is valid but contains zero placeholders (static)
     *   'placeholders_valid'  — file has placeholders and all are supported
     *   'invalid_placeholders'— file has one or more unsupported placeholders
     */
    public function getPlaceholderStatus(): string
    {
        if ($this->extension && $this->extension !== 'docx') {
            return 'not_applicable';
        }

        if (! filled($this->file_path)) {
            return 'no_file';
        }

        if ($this->validation_status === null) {
            return 'not_validated';
        }

        $result = $this->validation_result ?? [];

        if ($this->has_unknown_placeholders || $this->validation_status === 'invalid') {
            return 'invalid_placeholders';
        }

        $validPlaceholders = $result['valid'] ?? [];
        if (count($validPlaceholders) === 0) {
            return 'no_placeholders';
        }

        return 'placeholders_valid';
    }

    /**
     * Template resolution mode.
     *
     * Values:
     *   'explicit_context' — template has a usage_context and will be selected by that key
     *   'document_type_fallback' — no usage_context; selected by document_type only (legacy)
     */
    public function getResolutionMode(): string
    {
        $ctxValue = $this->getRawOriginal('usage_context');

        return filled($ctxValue) ? 'explicit_context' : 'document_type_fallback';
    }

    /**
     * Generation readiness — authoritative single flag for whether this template
     * can actually be selected and used for document generation.
     *
     * Values:
     *   'ready'                  — all conditions met
     *   'inactive'               — template is not active
     *   'no_file'                — no file uploaded
     *   'not_validated'          — file present but validation not run
     *   'invalid_placeholders'   — unknown placeholders block activation/generation
     *   'not_docx'               — file is not a DOCX (cannot be used for official docs)
     *
     * Note: a template with zero placeholders CAN be ready if it is a valid DOCX, active,
     * and has no unknown placeholders. Static templates are a supported use case.
     */
    public function getGenerationReadiness(): string
    {
        $rawStatus = $this->status instanceof TemplateStatus
            ? $this->status->value
            : (string) $this->status;

        if ($rawStatus !== TemplateStatus::ACTIVE->value) {
            return 'inactive';
        }

        if (! filled($this->file_path)) {
            return 'no_file';
        }

        if ($this->extension !== 'docx') {
            return 'not_docx';
        }

        if ($this->validation_status === null) {
            return 'not_validated';
        }

        if ($this->has_unknown_placeholders || $this->validation_status === 'invalid') {
            return 'invalid_placeholders';
        }

        return 'ready';
    }
}
