<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'day_of_week',
        'start_time',
        'end_time',
        'notes',
        'status',
    ];

    // Time fields are stored as time strings (HH:MM:SS)
    // No casting needed for time fields in Laravel

    /**
     * Get the coach that owns this schedule.
     */
    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }
}

