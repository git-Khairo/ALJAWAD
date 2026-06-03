<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoursePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'icon',
        'name_ar',
        'name_en',
        'subtitle_ar',
        'subtitle_en',
        'access_ar',
        'access_en',
        'price',
        'currency',
        'is_featured',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'price'      => 'integer',
        'sort_order' => 'integer',
        'is_featured' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function features()
    {
        return $this->hasMany(CoursePlanFeature::class);
    }
}
