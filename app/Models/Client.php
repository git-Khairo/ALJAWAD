<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'email_verified_at',
        'type',
        'status',
        'source',
        'notes',
        'tags',
        'telegram_chat_id',
        'lead_status',
        'last_contact',
        'courses_count',
        'converted_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'converted_at'      => 'datetime',
        'last_contact'      => 'datetime',
        'tags'              => 'array',
        'courses_count'     => 'integer',
    ];

    // ── Scopes ────────────────────────────────────────────────

    /** Only leads (not yet converted to client). */
    public function scopeLeads($query)
    {
        return $query->where('type', 'lead');
    }

    /** Only converted clients. */
    public function scopeClients($query)
    {
        return $query->where('type', 'client');
    }

    /** Only active clients. */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /** Only inactive clients. */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    // ── Helpers ───────────────────────────────────────────────

    public function isLead(): bool
    {
        return $this->type === 'lead';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isStudent(): bool
    {
        return $this->student !== null;
    }

    /**
     * Convert this lead to an active client.
     * Optionally link to an existing or new user account.
     */
    public function convertToClient(?int $userId = null): void
    {
        $this->update([
            'type'         => 'client',
            'status'       => 'active',
            'converted_at' => now(),
            'user_id'      => $userId ?? $this->user_id,
        ]);
    }

    // ── Relationships ─────────────────────────────────────────

    /** The auth user account for this client. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** The student record for this client (if enrolled). */
    public function student()
    {
        return $this->hasOne(Student::class, 'id');
    }

    /** Financial accounts belonging to this client. */
    public function accounts()
    {
        $clientAccountType = AccountType::where('slug', 'client')->first();
        if (! $clientAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }

        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $clientAccountType->id);
    }
}
