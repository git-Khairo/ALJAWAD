<?php

namespace App\Http\Controllers\Api\Bot;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class TelegramLinkController extends Controller
{
    /**
     * POST /api/bot/link-telegram   (X-Bot-Secret protected)
     * Called by CourseBot when a client presses START with a `link_<token>`
     * deep-link payload — links their Telegram chat id to their client record.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'token'   => 'required|string',
            'chat_id' => 'required',
        ]);

        $client = Client::where('telegram_link_token', $data['token'])->first();

        if (! $client || ! $client->user) {
            return response()->json(['ok' => false, 'message' => 'unknown_token'], 404);
        }

        $client->user->update(['telegram_chat_id' => (string) $data['chat_id']]);

        return response()->json([
            'ok'   => true,
            'name' => $client->user->name,
        ]);
    }
}
