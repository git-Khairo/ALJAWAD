<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coach extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'login_email',
        'login_password',
        'status',
    ];

    protected $hidden = [
        'login_password',
    ];

    // ── Helpers ───────────────────────────────────────────────

    public function roleName(): ?string
    {
        return $this->user?->getRoleNames()->first();
    }

    public function hasPermission(string $permission): bool
    {
        return $this->user?->can($permission) ?? false;
    }

    // ── Relationships ─────────────────────────────────────────

    /** The auth user account for this coach. */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Financial accounts belonging to this coach. */
    public function accounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        $coachAccountType = AccountType::where('slug', 'coach')->first();
        if (! $coachAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }

        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $coachAccountType->id);
    }

    /** Courses taught by this coach. */
    public function courses(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_coach')->withTimestamps();
    }

    /** Schedules assigned to this coach. */
    public function schedules(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
