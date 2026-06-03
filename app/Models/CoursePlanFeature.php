<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoursePlanFeature extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_plan_id',
        'text_ar',
        'text_en',
        'included',
        'sort_order',
    ];

    protected $casts = [
        'included'   => 'boolean',
        'sort_order' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function coursePlan()
    {
        return $this->belongsTo(CoursePlan::class);
    }
}
