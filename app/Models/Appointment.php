<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_name',
        'type_ar',
        'type_en',
        'date',
        'time',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
