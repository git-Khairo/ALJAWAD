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
        'password_set_at',
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
            'password_set_at'     => 'datetime',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * Normalize a phone number for storage + lookup: strip spaces, dashes,
     * parens and dots; keep a single leading "+". Deterministic so a number
     * entered at login matches what was stored. Mirrors the frontend helper.
     */
    public static function normalizePhone(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }
        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }
        $hasPlus = str_starts_with($raw, '+');
        $digits  = preg_replace('/\D+/', '', $raw);
        if ($digits === '') {
            return null;
        }

        return $hasPlus ? '+' . $digits : $digits;
    }

    /** Whether this account has a real (claimed) password and can log in by password. */
    public function hasUsablePassword(): bool
    {
        return $this->password_set_at !== null;
    }

    public function loginCodes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LoginCode::class);
    }

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
}
