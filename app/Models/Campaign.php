<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'status',
        'platform',
        'budget',
        'spent',
        'leads',
        'conversions',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'budget'      => 'integer',
        'spent'       => 'integer',
        'leads'       => 'integer',
        'conversions' => 'integer',
        'start_date'  => 'date',
        'end_date'    => 'date',
    ];
}
