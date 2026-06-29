<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBotSecret
{
    /**
     * Guards bot → app endpoints with the shared X-Bot-Secret header
     * (same secret the app uses to call the Telegram bot).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('services.telegram_bot.secret', '');

        if ($secret === '' || ! hash_equals($secret, (string) $request->header('X-Bot-Secret'))) {
            return response()->json(['message' => 'Invalid bot secret.'], 403);
        }

        return $next($request);
    }
}
