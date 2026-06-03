<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoursePlan;
use App\Models\CoursePlanFeature;
use Illuminate\Http\Request;

class CoursePlanController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => CoursePlan::with('features')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function show(CoursePlan $coursePlan)
    {
        return response()->json(['data' => $coursePlan->load('features')]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label'       => 'required|string|max:10',
            'icon'        => 'nullable|string',
            'name_ar'     => 'required|string',
            'name_en'     => 'required|string',
            'subtitle_ar' => 'nullable|string',
            'subtitle_en' => 'nullable|string',
            'access_ar'   => 'nullable|string',
            'access_en'   => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'currency'    => 'nullable|string|max:3',
            'is_featured' => 'nullable|boolean',
            'status'      => 'nullable|in:active,inactive',
            'sort_order'  => 'nullable|integer',
            'features'    => 'nullable|array',
        ]);

        $plan = CoursePlan::create($validated);

        if (!empty($validated['features'])) {
            foreach ($validated['features'] as $i => $f) {
                $plan->features()->create([
                    'text_ar'    => $f['text_ar'] ?? '',
                    'text_en'    => $f['text_en'] ?? '',
                    'included'   => $f['included'] ?? true,
                    'sort_order' => $i,
                ]);
            }
        }

        return response()->json(['data' => $plan->load('features')], 201);
    }

    public function update(Request $request, CoursePlan $coursePlan)
    {
        $validated = $request->validate([
            'label'       => 'sometimes|string|max:10',
            'icon'        => 'nullable|string',
            'name_ar'     => 'sometimes|string',
            'name_en'     => 'sometimes|string',
            'subtitle_ar' => 'nullable|string',
            'subtitle_en' => 'nullable|string',
            'access_ar'   => 'nullable|string',
            'access_en'   => 'nullable|string',
            'price'       => 'sometimes|integer|min:0',
            'currency'    => 'nullable|string|max:3',
            'is_featured' => 'nullable|boolean',
            'status'      => 'nullable|in:active,inactive',
            'sort_order'  => 'nullable|integer',
        ]);

        $coursePlan->update($validated);
        return response()->json(['data' => $coursePlan->load('features')]);
    }

    public function destroy(CoursePlan $coursePlan)
    {
        $coursePlan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }

    public function storeFeature(Request $request, CoursePlan $coursePlan)
    {
        $validated = $request->validate([
            'text_ar'  => 'required|string',
            'text_en'  => 'required|string',
            'included' => 'nullable|boolean',
        ]);

        $feature = $coursePlan->features()->create($validated);
        return response()->json(['data' => $feature], 201);
    }

    public function updateFeature(Request $request, CoursePlan $coursePlan, CoursePlanFeature $feature)
    {
        $validated = $request->validate([
            'text_ar'  => 'sometimes|string',
            'text_en'  => 'sometimes|string',
            'included' => 'nullable|boolean',
        ]);

        $feature->update($validated);
        return response()->json(['data' => $feature]);
    }

    public function destroyFeature(CoursePlan $coursePlan, CoursePlanFeature $feature)
    {
        $feature->delete();
        return response()->json(['message' => 'Feature deleted']);
    }
}
