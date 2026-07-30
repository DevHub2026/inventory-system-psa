<?php

namespace App\Modules\SystemSetup\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplateVersion extends Model
{
    protected $fillable = [
        'document_template_id',
        'version',
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
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'validation_result' => 'array',
            'has_unknown_placeholders' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'document_template_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
