<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('title_ar', 'like', "%$q%")
                   ->orWhere('title_en', 'like', "%$q%");
            });
        }

        return response()->json(['data' => $query->orderByDesc('id')->get()]);
    }

    public function show(Course $course)
    {
        return response()->json(['data' => $course->load('coaches')]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar'       => 'required|string|max:255',
            'title_en'       => 'required|string|max:255',
            'category'       => 'required|in:forex,crypto,stocks',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'level_ar'       => 'nullable|string',
            'level_en'       => 'nullable|string',
            'duration_ar'    => 'nullable|string',
            'duration_en'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'sessions'       => 'nullable|integer|min:0',
            'enrolled'       => 'nullable|integer|min:0',
            'status'         => 'nullable|in:active,inactive,archived',
        ]);

        $course = Course::create($validated);
        return response()->json(['data' => $course], 201);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title_ar'       => 'sometimes|string|max:255',
            'title_en'       => 'sometimes|string|max:255',
            'category'       => 'sometimes|in:forex,crypto,stocks',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'level_ar'       => 'nullable|string',
            'level_en'       => 'nullable|string',
            'duration_ar'    => 'nullable|string',
            'duration_en'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'sessions'       => 'nullable|integer|min:0',
            'enrolled'       => 'nullable|integer|min:0',
            'status'         => 'nullable|in:active,inactive,archived',
        ]);

        $course->update($validated);
        return response()->json(['data' => $course]);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }
}
