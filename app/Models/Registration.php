<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'payment_status',
        'amount_paid',
        'registration_date',
        'status',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'registration_date' => 'date',
    ];

    /**
     * Get the student that registered.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the course that was registered for.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the affiliate commissions for this registration.
     */
    public function affiliateCommissions()
    {
        return $this->hasMany(AffiliateCommission::class);
    }
}

