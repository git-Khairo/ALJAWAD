<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaLibraryItem extends Model
{
    use HasFactory;

    protected $table = 'media_library';

    protected $fillable = [
        'category', 'title', 'notes', 'status', 'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];
}
