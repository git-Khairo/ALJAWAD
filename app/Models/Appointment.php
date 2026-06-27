<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'client_name',
        'type_ar',
        'type_en',
        'date',
        'time',
        'status',
        'notes',
        'assigned_coach_id',
        'notified_24h',
        'notified_1h',
    ];

    protected $casts = [
        'date'          => 'date',
        'notified_24h'  => 'boolean',
        'notified_1h'   => 'boolean',
    ];

    public function assignedCoach()
    {
        return $this->belongsTo(User::class, 'assigned_coach_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
