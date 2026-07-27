<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryImport extends Model
{
    protected $fillable = [
        'original_filename',
        'stored_path',
        'total_rows',
        'imported_rows',
        'failed_rows',
        'skipped_rows',
        'column_mapping',
        'import_errors',
        'status',
        'created_by',
    ];

    protected $casts = [
        'column_mapping' => 'array',
        'import_errors' => 'array',
        'total_rows' => 'integer',
        'imported_rows' => 'integer',
        'failed_rows' => 'integer',
        'skipped_rows' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}