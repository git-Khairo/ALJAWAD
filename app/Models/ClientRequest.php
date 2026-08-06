<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A sub-IB's proposal to add a client. Pending until an admin reviews it from
 * the CRM Clients tab; approving materializes a real user + client underneath
 * the requesting IB.
 */
class ClientRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requested_by_user_id',
        'name',
        'phone',
        'email',
        'telegram_chat_id',
        'broker_id',
        'account_number',
        'source',
        'note',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_note',
        'client_id',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    // ── Scopes ────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    // ── Relationships ─────────────────────────────────────────

    /** The IB who submitted this request. */
    public function requestedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function reviewedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function broker(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    /** The client this request created, once approved. */
    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
