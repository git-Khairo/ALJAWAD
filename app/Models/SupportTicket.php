<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'subject',
        'user_name',
        'user_ref_id',
        'user_type',
        'category',
        'priority',
        'status',
        'opened_at',
        'first_response_at',
        'resolved_at',
        'csat',
        'escalated',
        'agent',
        'notes',
    ];

    protected $casts = [
        'opened_at'          => 'datetime',
        'first_response_at'  => 'datetime',
        'resolved_at'        => 'datetime',
        'csat'               => 'integer',
        'escalated'          => 'boolean',
    ];
}
