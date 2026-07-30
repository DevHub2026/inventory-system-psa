<?php

namespace App\Modules\LostAssetReport\Models;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LostAssetReport extends Model
{
    use SoftDeletes;

    protected $table = 'lost_asset_reports';

    protected $fillable = [
        'asset_id',
        'reporter_id',
        'description',
        'last_known_location',
        'date_lost',
        'remarks',
        'status',
        'workflow_version_id',
        'current_level_order',
        'workflow_status',
    ];

    protected $casts = [
        'date_lost' => 'date',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
