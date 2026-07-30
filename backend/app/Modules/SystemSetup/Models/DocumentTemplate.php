<?php

namespace App\Modules\SystemSetup\Models;

use App\Models\User;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
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
}
