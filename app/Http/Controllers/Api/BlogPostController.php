<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogPostController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::query();

        // Public requests (no auth token) only see published posts
        if (! $request->user()) {
            $query->where('status', 'published');
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('title_ar', 'like', "%$q%")
                   ->orWhere('title_en', 'like', "%$q%");
            });
        }

        return response()->json(['data' => $query->orderByDesc('published_at')->get()]);
    }

    public function show(BlogPost $blogPost)
    {
        $blogPost->increment('views');
        return response()->json(['data' => $blogPost]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar'    => 'required|string|max:255',
            'title_en'    => 'required|string|max:255',
            'category'    => 'required|in:forex,crypto,stocks',
            'author_ar'   => 'nullable|string',
            'author_en'   => 'nullable|string',
            'excerpt_ar'  => 'nullable|string',
            'excerpt_en'  => 'nullable|string',
            'content_ar'  => 'nullable|string',
            'content_en'  => 'nullable|string',
            'image_type'  => 'nullable|string',
            'read_time'   => 'nullable|integer',
            'status'      => 'nullable|in:draft,published',
        ]);

        if (($validated['status'] ?? 'draft') === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $post = BlogPost::create($validated);
        return response()->json(['data' => $post], 201);
    }

    public function update(Request $request, BlogPost $blogPost)
    {
        $validated = $request->validate([
            'title_ar'    => 'sometimes|string|max:255',
            'title_en'    => 'sometimes|string|max:255',
            'category'    => 'sometimes|in:forex,crypto,stocks',
            'author_ar'   => 'nullable|string',
            'author_en'   => 'nullable|string',
            'excerpt_ar'  => 'nullable|string',
            'excerpt_en'  => 'nullable|string',
            'content_ar'  => 'nullable|string',
            'content_en'  => 'nullable|string',
            'image_type'  => 'nullable|string',
            'read_time'   => 'nullable|integer',
            'status'      => 'nullable|in:draft,published',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'published' && !$blogPost->published_at) {
            $validated['published_at'] = now();
        }

        $blogPost->update($validated);
        return response()->json(['data' => $blogPost]);
    }

    public function destroy(BlogPost $blogPost)
    {
        $blogPost->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
