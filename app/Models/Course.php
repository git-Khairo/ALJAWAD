<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'price',
        'duration_hours',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    /**
     * Get the coaches that teach this course.
     */
    public function coaches()
    {
        return $this->belongsToMany(Coach::class, 'course_coach')
            ->withTimestamps();
    }

    /**
     * Get the registrations for this course.
     */
    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }
}

