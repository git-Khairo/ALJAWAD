<?php

namespace App\Services;

use App\Models\CourseAccessGrant;
use App\Models\CoursePlan;
use App\Models\User;

class CourseAccessService
{
    public function __construct(private TelegramBotService $bot) {}

    /**
     * Grant (or renew) a Telegram user's access to a plan's channels for N days.
     * Idempotent per (plan, telegram_chat_id). Asks the bot to subscribe the user
     * and stores the returned invite links on the grant. If the grant is linked to
     * one of our users who has no Telegram ID on file yet, the ID is saved to them.
     *
     * @return array{grant: CourseAccessGrant, bot_result: array, invite_links: array}
     */
    public function grant(CoursePlan $plan, int $telegramChatId, int $accessDays, ?int $userId = null): array
    {
        $grant = CourseAccessGrant::updateOrCreate(
            ['course_plan_id' => $plan->id, 'telegram_chat_id' => (string) $telegramChatId],
            [
                'user_id'    => $userId,
                'bot_plan'   => $plan->bot_plan,
                'granted_at' => now(),
                'expires_at' => now()->addDays($accessDays),
                'revoked_at' => null,
                'status'     => 'active',
            ]
        );

        // Keep the linked user's Telegram ID in sync so future grants auto-work.
        if ($userId) {
            $user = User::find($userId);
            if ($user && empty($user->telegram_chat_id)) {
                $user->update(['telegram_chat_id' => (string) $telegramChatId]);
            }
        }

        $botResult = $this->bot->grantAccess($telegramChatId, $plan->bot_plan, $accessDays);

        if (! empty($botResult['invite_links'])) {
            $grant->update(['invite_links' => $botResult['invite_links']]);
        }

        return [
            'grant'        => $grant->fresh('user'),
            'bot_result'   => $botResult,
            'invite_links' => $botResult['invite_links'] ?? [],
        ];
    }
}
