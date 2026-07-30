<?php

namespace App\Modules\QrScan\Models;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QrScanHistory extends Model
{
    use SoftDeletes;

    protected $table = 'qr_scan_histories';

    protected $fillable = [
        'asset_id',
        'user_id',
        'action_performed',
        'device',
        'platform',
        'browser',
        'scan_source',
        'ip_address',
        'scanned_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
