<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use HasFactory;

    protected $table = 'user_notifications';

    protected $fillable = [
        'title_ar', 'title_en',
        'message_ar', 'message_en',
        'type', 'read',
    ];

    protected $casts = [
        'read' => 'boolean',
    ];
}
