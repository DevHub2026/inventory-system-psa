<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    protected $fillable = [
        'user_id',
        'device_name',
        'browser',
        'platform',
        'ip_address',
        'last_activity',
        'login_at',
        'is_active',
    ];

    protected $casts = [
        'last_activity' => 'datetime',
        'login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    public function updateLastActivity(): void
    {
        $this->update(['last_activity' => now()]);
    }
}
