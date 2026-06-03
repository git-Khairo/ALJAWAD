<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_ar',
        'title_en',
        'category',
        'author_ar',
        'author_en',
        'excerpt_ar',
        'excerpt_en',
        'content_ar',
        'content_en',
        'image_type',
        'read_time',
        'views',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'views'        => 'integer',
    ];
}
