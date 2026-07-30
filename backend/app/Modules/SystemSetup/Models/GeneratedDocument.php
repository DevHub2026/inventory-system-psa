<?php

namespace App\Modules\SystemSetup\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedDocument extends Model
{
    protected $fillable = [
        'document_template_id',
        'document_type',
        'target_type',
        'target_id',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'status',
        'metadata',
        'generated_by',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'target_id' => 'integer',
            'metadata' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'document_template_id');
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
