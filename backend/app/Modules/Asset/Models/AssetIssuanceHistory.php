<?php

namespace App\Modules\Asset\Models;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetIssuanceHistory extends Model
{
    protected $table = 'asset_issuance_histories';

    protected $fillable = [
        'asset_id',
        'previous_employee_id',
        'new_employee_id',
        'transferred_by',
        'transfer_date',
        'reason',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'transfer_date' => 'date',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function previousEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'previous_employee_id');
    }

    public function newEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'new_employee_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
