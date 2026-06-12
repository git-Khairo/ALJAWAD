<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarTask extends Model
{
    protected $fillable = [
        'title',
        'notes',
        'date',
        'time',
        'assigned_coach_id',
        'priority',
        'status',
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
}
