<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'title_ar',
        'title_en',
        'category',
        'description',
        'description_ar',
        'description_en',
        'level_ar',
        'level_en',
        'duration_ar',
        'duration_en',
        'price',
        'duration_hours',
        'sessions',
        'enrolled',
        'status',
    ];

    protected $casts = [
        'price'    => 'float',
        'sessions' => 'integer',
        'enrolled' => 'integer',
    ];

    public function coaches()
    {
        return $this->belongsToMany(Coach::class, 'course_coach')->withTimestamps();
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }
}
