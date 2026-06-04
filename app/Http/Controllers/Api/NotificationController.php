<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => UserNotification::where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function markRead(Request $request, UserNotification $notification)
    {
        abort_if($notification->user_id !== $request->user()->id, 403);
        $notification->update(['read' => true]);
        return response()->json(['data' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'title_ar'   => 'required|string',
            'title_en'   => 'required|string',
            'message_ar' => 'nullable|string',
            'message_en' => 'nullable|string',
            'type'       => 'nullable|in:info,success,warning,error',
        ]);

        // Default to sender's own user_id if not specified
        $validated['user_id'] = $validated['user_id'] ?? $request->user()->id;

        $n = UserNotification::create($validated);
        return response()->json(['data' => $n], 201);
    }

    public function destroy(Request $request, UserNotification $notification)
    {
        abort_if($notification->user_id !== $request->user()->id, 403);
        $notification->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
