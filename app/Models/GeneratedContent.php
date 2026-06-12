<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedContent extends Model
{
    protected $fillable = [
        'type',
        'platform',
        'prompt',
        'generated_ar',
        'generated_en',
        'tone',
        'language',
        'audience',
        'duration_seconds',
        'status',
        'created_by',
        'scheduled_date',
        'scheduled_time',
        'assigned_coach_id',
        'notified_24h',
        'notified_1h',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'scheduled_date'   => 'date',
        'notified_24h'     => 'boolean',
        'notified_1h'      => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedCoach()
    {
        return $this->belongsTo(User::class, 'assigned_coach_id');
    }
}
