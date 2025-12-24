<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coach extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'specialization',
        'status',
    ];

    /**
     * Get the accounts for this coach.
     */
    public function accounts()
    {
        $coachAccountType = AccountType::where('slug', 'coach')->first();
        if (!$coachAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }
        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $coachAccountType->id);
    }

    /**
     * Get the courses taught by this coach.
     */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_coach')
            ->withTimestamps();
    }

    /**
     * Get the schedules for this coach.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}

