<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * GET /api/admin/settings
     * Returns all settings as a flat key => value map.
     */
    public function index()
    {
        return response()->json(['data' => Setting::allAsMap()]);
    }

    /**
     * PUT /api/admin/settings
     * Accepts { key: value, ... } and upserts each pair.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            '*' => 'present',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['data' => Setting::allAsMap()]);
    }
}
