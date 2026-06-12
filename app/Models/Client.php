<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'source',
        'tags',
        'lead_status',
        'last_contact',
        'courses_count',
        'converted_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
        'last_contact' => 'datetime',
        'tags'         => 'array',
        'courses_count'=> 'integer',
    ];

    // ── Scopes ────────────────────────────────────────────────

    public function scopeLeads($query)
    {
        return $query->where('type', 'lead');
    }

    public function scopeClients($query)
    {
        return $query->where('type', 'client');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

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

    public function convertToClient(): void
    {
        $this->update([
            'type'         => 'client',
            'status'       => 'active',
            'converted_at' => now(),
        ]);
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

    /** Student enrollment record (if the client has enrolled in a course). */
    public function student(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Student::class, 'id');
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
