<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Campaign::orderByDesc('id')->get()]);
    }

    public function show(Campaign $campaign)
    {
        return response()->json(['data' => $campaign]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar'    => 'required|string',
            'name_en'    => 'required|string',
            'status'     => 'nullable|in:active,completed,draft,paused',
            'platform'   => 'required|string',
            'budget'     => 'nullable|integer|min:0',
            'spent'      => 'nullable|integer|min:0',
            'leads'      => 'nullable|integer|min:0',
            'conversions'=> 'nullable|integer|min:0',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
        ]);

        $campaign = Campaign::create($validated);
        return response()->json(['data' => $campaign], 201);
    }

    public function update(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'name_ar'    => 'sometimes|string',
            'name_en'    => 'sometimes|string',
            'status'     => 'nullable|in:active,completed,draft,paused',
            'platform'   => 'sometimes|string',
            'budget'     => 'nullable|integer|min:0',
            'spent'      => 'nullable|integer|min:0',
            'leads'      => 'nullable|integer|min:0',
            'conversions'=> 'nullable|integer|min:0',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
        ]);

        $campaign->update($validated);
        return response()->json(['data' => $campaign]);
    }

    public function destroy(Campaign $campaign)
    {
        $campaign->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
