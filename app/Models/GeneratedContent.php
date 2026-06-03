<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedContent extends Model
{
    protected $fillable = [
        'type',
        'platform',
        'prompt',
        'generated_ar',
        'generated_en',
        'tone',
        'language',
        'audience',
        'duration_seconds',
        'status',
        'created_by',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
