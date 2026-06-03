<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Webinar;
use Illuminate\Http\Request;

class WebinarController extends Controller
{
    public function index(Request $request)
    {
        $query = Webinar::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->orderBy('date')->get()]);
    }

    public function show(Webinar $webinar)
    {
        return response()->json(['data' => $webinar]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar'       => 'required|string',
            'title_en'       => 'required|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'date'           => 'required|date',
            'time'           => 'required|string',
            'duration'       => 'nullable|integer|min:0',
            'platform'       => 'nullable|string',
            'link'           => 'nullable|string',
            'meeting_link'   => 'nullable|string',
            'capacity'       => 'nullable|integer|min:0',
            'registered'     => 'nullable|integer|min:0',
            'status'         => 'nullable|in:upcoming,completed,draft,cancelled',
        ]);

        // Normalize: frontend sends meeting_link, model uses link
        if (isset($validated['meeting_link']) && !isset($validated['link'])) {
            $validated['link'] = $validated['meeting_link'];
        }
        unset($validated['meeting_link']);

        $webinar = Webinar::create($validated);
        return response()->json(['data' => $webinar], 201);
    }

    public function update(Request $request, Webinar $webinar)
    {
        $validated = $request->validate([
            'title_ar'       => 'sometimes|string',
            'title_en'       => 'sometimes|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'date'           => 'sometimes|date',
            'time'           => 'sometimes|string',
            'duration'       => 'nullable|integer',
            'platform'       => 'nullable|string',
            'link'           => 'nullable|string',
            'meeting_link'   => 'nullable|string',
            'capacity'       => 'nullable|integer',
            'registered'     => 'nullable|integer',
            'status'         => 'nullable|in:upcoming,completed,draft,cancelled',
        ]);

        if (isset($validated['meeting_link']) && !isset($validated['link'])) {
            $validated['link'] = $validated['meeting_link'];
        }
        unset($validated['meeting_link']);

        $webinar->update($validated);
        return response()->json(['data' => $webinar]);
    }

    public function destroy(Webinar $webinar)
    {
        $webinar->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
