<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingPlanItem extends Model
{
    use HasFactory;

    protected $table = 'marketing_plan_items';

    protected $fillable = [
        'marketing_plan_id', 'type', 'platform',
        'title_ar', 'title_en', 'script_ar', 'script_en',
        'date', 'time', 'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function plan()
    {
        return $this->belongsTo(MarketingPlan::class, 'marketing_plan_id');
    }
}
