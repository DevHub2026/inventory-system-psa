<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get the user that updated the setting.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get setting value as string.
     */
    public function getStringValue(): string
    {
        return is_array($this->value) ? json_encode($this->value) : (string) $this->value;
    }

    /**
     * Get setting value as integer.
     */
    public function getIntValue(): int
    {
        return (int) $this->value;
    }

    /**
     * Get setting value as boolean.
     */
    public function getBoolValue(): bool
    {
        return (bool) $this->value;
    }

    /**
     * Scope a query to find by key.
     */
    public function scopeByKey($query, $key)
    {
        return $query->where('key', $key);
    }
}
