<?php

namespace App\Modules\SystemSetup\Models;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\User;

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
        'uploaded_by',
        'upload_date',
        'header_org_name',
        'header_office_name',
        'header_title',
        'logo_url',
        'body_template',
        'footer_text',
        'footer_notes',
        'signature_blocks',
        'paper_size',
        'orientation',
        'margin_top',
        'margin_bottom',
        'margin_left',
        'margin_right',
        'font_family',
        'font_size',
        'text_alignment',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_default'       => 'boolean',
            'file_size'        => 'integer',
            'upload_date'      => 'datetime',
            'status'           => TemplateStatus::class,
            'document_type'    => DocumentType::class,
            'signature_blocks' => 'array',
            'margin_top'       => 'float',
            'margin_bottom'    => 'float',
            'margin_left'      => 'float',
            'margin_right'     => 'float',
            'font_size'        => 'integer',
        ];
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
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
     * Get the default active template for a given document type.
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
     * Get all active templates for a document type.
     */
    public static function getActiveFor(DocumentType|string $type): self
    {
        $value = $type instanceof DocumentType ? $type->value : $type;

        return self::query()
            ->where('document_type', $value)
            ->where('status', TemplateStatus::ACTIVE->value)
            ->orderByDesc('is_default')
            ->orderByDesc('upload_date')
            ->get();
    }

    /**
     * Full URL to the stored template file.
     */
    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return asset('storage/'.$this->file_path);
    }

    /**
     * Human-readable status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->status instanceof TemplateStatus
            ? $this->status->label()
            : ($this->status === TemplateStatus::ACTIVE->value ? 'Active' : 'Inactive');
    }

    /**
     * Check if this template is the default.
     */
    public function getIsDefaultLabelAttribute(): string
    {
        return $this->is_default ? 'Default' : '';
    }
}
