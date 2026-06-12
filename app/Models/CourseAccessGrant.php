<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseAccessGrant extends Model
{
    protected $fillable = [
        'course_plan_id',
        'telegram_chat_id',
        'user_id',
        'bot_plan',
        'granted_at',
        'expires_at',
        'revoked_at',
        'status',
        'invite_links',
    ];

    protected $casts = [
        'granted_at'  => 'datetime',
        'expires_at'  => 'datetime',
        'revoked_at'  => 'datetime',
        'invite_links' => 'array',
    ];

    public function coursePlan()
    {
        return $this->belongsTo(CoursePlan::class);
    }

    // Optional: link back to our users table if we have a match
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
