<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'user_type',
        'is_active',
        'telegram_chat_id',
        'affiliate_code',
        'affiliate_balance',
        'referred_by_user_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'password'            => 'hashed',
            'is_active'           => 'boolean',
            'affiliate_balance'   => 'decimal:2',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isCoach(): bool
    {
        return $this->user_type === 'coach';
    }

    public function isClient(): bool
    {
        return $this->user_type === 'client';
    }

    public function isAffiliate(): bool
    {
        return ! is_null($this->affiliate_code);
    }

    // ── Relationships ─────────────────────────────────────────

    /** CRM profile for leads and clients. */
    public function client(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Client::class);
    }

    /** Staff profile for coaches and internal team members. */
    public function coach(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Coach::class);
    }

    /** The user who referred this user via an affiliate code. */
    public function referredBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }

    /** Users this user has referred. */
    public function referrals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'referred_by_user_id');
    }

    /** Commissions earned by this user as an affiliate. */
    public function affiliateCommissions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AffiliateCommission::class, 'referrer_user_id');
    }
}
