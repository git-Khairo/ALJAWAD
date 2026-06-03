<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SentNotification extends Model
{
    use HasFactory;

    protected $table = 'sent_notifications';

    protected $fillable = ['message', 'recipients', 'count'];

    protected $casts = [
        'count' => 'integer',
    ];
}
