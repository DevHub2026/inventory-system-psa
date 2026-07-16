<?php

namespace App\Modules\Maintenance\Models;

use App\Modules\Asset\Models\Asset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Maintenance extends Model
{
    use SoftDeletes;

    protected $table = 'maintenances';

    protected $fillable = [
        'asset_id',
        'user_id',
        'type',
        'status',
        'scheduled_date',
        'completed_date',
        'description',
        'notes',
        'cost',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'cost' => 'decimal:2',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
