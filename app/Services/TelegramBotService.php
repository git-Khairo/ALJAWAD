<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotService
{
    private string $botUrl;
    private string $secret;

    public function __construct()
    {
        $this->botUrl = rtrim(config('services.telegram_bot.url', ''), '/');
        $this->secret = config('services.telegram_bot.secret', '');
    }

    /**
     * Ask the Python bot to subscribe a Telegram user to a plan's channels.
     *
     * @param  int    $telegramChatId  The Telegram user ID
     * @param  string $plan            Bot plan name: beginner | intermediate | expert
     * @param  int    $accessDays      How long the access should last
     * @return array{ok: bool, plan?: string, expires_at?: string, invite_links?: array, error?: string}
     */
    public function grantAccess(int $telegramChatId, string $plan, int $accessDays): array
    {
        if (! $this->botUrl) {
            return ['ok' => false, 'error' => 'Bot URL not configured'];
        }

        try {
            $response = Http::withHeaders(['X-Bot-Secret' => $this->secret])
                ->timeout(15)
                ->post("{$this->botUrl}/grant", [
                    'telegram_chat_id' => $telegramChatId,
                    'plan'             => $plan,
                    'access_days'      => $accessDays,
                ]);

            return $response->json() ?? ['ok' => false, 'error' => 'Empty response'];
        } catch (\Throwable $e) {
            Log::error('TelegramBotService::grantAccess failed', ['error' => $e->getMessage()]);
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Ask the Python bot to revoke a Telegram user's subscription across all plan channels.
     *
     * @return array{ok: bool, error?: string}
     */
    public function revokeAccess(int $telegramChatId): array
    {
        if (! $this->botUrl) {
            return ['ok' => false, 'error' => 'Bot URL not configured'];
        }

        try {
            $response = Http::withHeaders(['X-Bot-Secret' => $this->secret])
                ->timeout(15)
                ->post("{$this->botUrl}/revoke", [
                    'telegram_chat_id' => $telegramChatId,
                ]);

            return $response->json() ?? ['ok' => false, 'error' => 'Empty response'];
        } catch (\Throwable $e) {
            Log::error('TelegramBotService::revokeAccess failed', ['error' => $e->getMessage()]);
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get a Telegram user's current subscription status.
     *
     * @return array{ok: bool, active?: bool, plan?: string, end_date?: string, days_left?: int, error?: string}
     */
    public function getStatus(int $telegramChatId): array
    {
        if (! $this->botUrl) {
            return ['ok' => false, 'error' => 'Bot URL not configured'];
        }

        try {
            $response = Http::withHeaders(['X-Bot-Secret' => $this->secret])
                ->timeout(10)
                ->get("{$this->botUrl}/status/{$telegramChatId}");

            return $response->json() ?? ['ok' => false, 'error' => 'Empty response'];
        } catch (\Throwable $e) {
            Log::error('TelegramBotService::getStatus failed', ['error' => $e->getMessage()]);
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
