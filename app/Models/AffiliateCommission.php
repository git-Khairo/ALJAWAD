<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'referrer_user_id',
        'registration_id',
        'amount',
        'percentage',
        'status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'paid_at'    => 'date',
        'amount'     => 'decimal:2',
        'percentage' => 'decimal:2',
    ];

    // ── Relationships ─────────────────────────────────────────

    /** The user who referred the registrant and earns this commission. */
    public function referrer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function registration(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }
}
