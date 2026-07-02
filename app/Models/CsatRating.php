<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CsatRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'client_id',
        'agent_id',
        'contact_label',
        'stars',
        'comment',
        'requested_at',
        'responded_at',
        'expires_at',
    ];

    protected $casts = [
        'stars'        => 'integer',
        'requested_at' => 'datetime',
        'responded_at' => 'datetime',
        'expires_at'   => 'datetime',
    ];

    public function isAnswered(): bool
    {
        return $this->responded_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** The CRM client being rated (nullable for non-CRM WhatsApp contacts). */
    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** The staff member (CS agent) who requested the rating. */
    public function agent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
