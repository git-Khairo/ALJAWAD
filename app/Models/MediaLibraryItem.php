<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaLibraryItem extends Model
{
    use HasFactory;

    protected $table = 'media_library';

    protected $fillable = [
        'user_id', 'category', 'title', 'notes', 'status', 'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
