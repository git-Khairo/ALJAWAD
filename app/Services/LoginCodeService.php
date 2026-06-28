<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class LoginCodeService
{
    public function __construct(private TelegramBotService $bot) {}

    /**
     * Issue a fresh 6-digit one-time code for the user (invalidating any prior
     * unconsumed codes) and deliver it via Telegram when a numeric chat id is
     * available. The plaintext code is returned for admin/support delivery —
     * never expose it from a public endpoint.
     *
     * @return array{code: string, sent_via: string}  sent_via: telegram | support
     */
    public function issue(User $user): array
    {
        // One live code at a time.
        $user->loginCodes()->whereNull('consumed_at')->update(['consumed_at' => now()]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->loginCodes()->create([
            'code_hash'  => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $sentViaTelegram = false;
        $chatId = $this->numericChatId($user->telegram_chat_id);
        if ($chatId) {
            $sentViaTelegram = $this->bot->notify(
                $chatId,
                "🔐 Your AlJawad access code is: {$code}\nValid for 10 minutes. Do not share it with anyone."
            );
        }

        return ['code' => $code, 'sent_via' => $sentViaTelegram ? 'telegram' : 'support'];
    }

    /** Telegram DMs need a numeric chat id; @usernames can't receive bot messages. */
    private function numericChatId(?string $raw): ?int
    {
        if ($raw === null) {
            return null;
        }
        $raw = ltrim(trim($raw), '@');

        return ctype_digit($raw) ? (int) $raw : null;
    }
}
