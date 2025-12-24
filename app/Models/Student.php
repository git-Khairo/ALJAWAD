<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'student_number',
        'enrollment_date',
        'status',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
    ];

    /**
     * Get the client that this student belongs to.
     */
    public function client()
    {
        return $this->belongsTo(Client::class, 'id');
    }

    /**
     * Get the registrations for this student.
     */
    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }
}

