<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faq extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'question',
        'answer',
        'category',
        'keywords',
        'roles',
        'destination',
        'actions',
        'active',
    ];

    protected $casts = [
        'keywords' => 'array',
        'roles' => 'array',
        'actions' => 'array',
        'active' => 'boolean',
    ];
}
