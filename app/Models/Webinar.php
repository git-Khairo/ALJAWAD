<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Webinar extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'date',
        'time',
        'duration',
        'platform',
        'link',
        'registered',
        'capacity',
        'status',
    ];

    protected $casts = [
        'date'       => 'date',
        'duration'   => 'integer',
        'registered' => 'integer',
        'capacity'   => 'integer',
    ];
}
