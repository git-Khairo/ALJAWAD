<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => UserNotification::orderByDesc('id')->get(),
        ]);
    }

    public function markRead(UserNotification $notification)
    {
        $notification->update(['read' => true]);
        return response()->json(['data' => $notification]);
    }

    public function markAllRead()
    {
        UserNotification::where('read', false)->update(['read' => true]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar'   => 'required|string',
            'title_en'   => 'required|string',
            'message_ar' => 'nullable|string',
            'message_en' => 'nullable|string',
            'type'       => 'nullable|in:info,success,warning,error',
        ]);

        $n = UserNotification::create($validated);
        return response()->json(['data' => $n], 201);
    }

    public function destroy(UserNotification $notification)
    {
        $notification->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
