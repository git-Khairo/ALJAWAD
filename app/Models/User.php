<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'user_type',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
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

    // ── Relationships ─────────────────────────────────────────

    /** The client profile linked to this user account. */
    public function client()
    {
        return $this->hasOne(Client::class);
    }

    /** The coach profile linked to this user account. */
    public function coach()
    {
        return $this->hasOne(Coach::class);
    }
}
