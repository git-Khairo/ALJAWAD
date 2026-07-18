<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'stage',
        'source',
        'tags',
        'lead_status',
        'last_contact',
        'converted_at',
        'activated_at',
        'telegram_link_token',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
        'activated_at' => 'datetime',
        'last_contact' => 'datetime',
        'tags'         => 'array',
    ];

    // ── Scopes ────────────────────────────────────────────────

    public function scopeLeads($query)
    {
        return $query->where('stage', 'lead');
    }

    public function scopeClients($query)
    {
        return $query->whereIn('stage', ['client_inactive', 'client_active']);
    }

    public function scopeActive($query)
    {
        return $query->where('stage', 'client_active');
    }

    public function scopeInactive($query)
    {
        return $query->where('stage', 'client_inactive');
    }

    // ── Helpers ───────────────────────────────────────────────

    public function isLead(): bool
    {
        return $this->stage === 'lead';
    }

    public function isClient(): bool
    {
        return in_array($this->stage, ['client_inactive', 'client_active'], true);
    }

    public function isActive(): bool
    {
        return $this->stage === 'client_active';
    }

    /** Lead → inactive client (account opened / converted, no money yet). */
    public function promoteToClient(): void
    {
        if ($this->isLead()) {
            $this->update([
                'stage'        => 'client_inactive',
                'converted_at' => $this->converted_at ?? now(),
            ]);
        }
    }

    /** → active client (first deposit / paid course or consultation). */
    public function activate(): void
    {
        if ($this->stage !== 'client_active') {
            $this->update([
                'stage'        => 'client_active',
                'activated_at' => $this->activated_at ?? now(),
                'converted_at' => $this->converted_at ?? now(),
            ]);
        }
    }

    // ── Relationships ─────────────────────────────────────────

    /** The auth / profile user account for this CRM record. */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** CRM notes left by coaches on this client/lead. */
    public function notes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ClientNote::class)->orderByDesc('created_at');
    }

    /** Telegram course-access grants (keyed by the shared user_id) — drives "student". */
    public function accessGrants(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CourseAccessGrant::class, 'user_id', 'user_id');
    }

    /** Trading account numbers / broker user IDs — at most one per broker. */
    public function tradingAccounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ClientTradingAccount::class);
    }

    /** Financial accounts belonging to this client. */
    public function accounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        $clientAccountType = AccountType::where('slug', 'client')->first();
        if (! $clientAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }

        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $clientAccountType->id);
    }
}
