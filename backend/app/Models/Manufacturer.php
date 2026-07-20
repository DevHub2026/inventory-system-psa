<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Manufacturer extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'contact_number',
        'email',
        'address',
        'description',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Get the assets for the manufacturer.
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
}
