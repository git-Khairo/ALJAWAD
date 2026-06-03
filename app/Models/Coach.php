<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coach extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'specialization',
        'status',
    ];

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Return the coach's role name via their linked user account.
     * Delegates to Spatie roles on the User model.
     */
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
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Financial accounts belonging to this coach. */
    public function accounts()
    {
        $coachAccountType = AccountType::where('slug', 'coach')->first();
        if (! $coachAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }

        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $coachAccountType->id);
    }

    /** Courses taught by this coach. */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_coach')
            ->withTimestamps();
    }

    /** Schedules assigned to this coach. */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

}
