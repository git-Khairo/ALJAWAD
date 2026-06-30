<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar', 'name_en', 'month', 'year',
        'goal_ar', 'goal_en', 'status', 'campaign_ids',
    ];

    protected $casts = [
        'month'        => 'integer',
        'year'         => 'integer',
        'campaign_ids' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(MarketingPlanItem::class);
    }
}
