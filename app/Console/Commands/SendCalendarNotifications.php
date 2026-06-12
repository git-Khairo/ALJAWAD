<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\CalendarTask;
use App\Models\GeneratedContent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendCalendarNotifications extends Command
{
    protected $signature   = 'calendar:notify';
    protected $description = 'Send 24h and 1h Telegram reminders for upcoming calendar events';

    public function handle(): void
    {
        $token = config('services.telegram_bot.token');

        if (! $token) {
            $this->warn('TELEGRAM_BOT_TOKEN not set — skipping notifications.');
            return;
        }

        $sent = 0;
        $sent += $this->notifyAppointments($token);
        $sent += $this->notifyTasks($token);
        $sent += $this->notifyContent($token);

        $this->info("Sent {$sent} Telegram notification(s).");
    }

    private function notifyAppointments(string $token): int
    {
        $sent = 0;

        // 24h window
        $events24h = Appointment::where('notified_24h', false)
            ->whereNotNull('assigned_coach_id')
            ->get()
            ->filter(fn($a) => $this->inWindow($a->date->toDateString(), $a->time, 24 * 60));

        foreach ($events24h as $apt) {
            if ($apt->assignedCoach?->telegram_chat_id) {
                $this->send($token, $apt->assignedCoach->telegram_chat_id,
                    "⏰ [AlJawad] Reminder: Appointment \"{$apt->type_en} — {$apt->client_name}\" is in 24 hours ({$apt->date->toDateString()} at {$apt->time})");
                $apt->update(['notified_24h' => true]);
                $sent++;
            }
        }

        // 1h window
        $events1h = Appointment::where('notified_1h', false)
            ->whereNotNull('assigned_coach_id')
            ->get()
            ->filter(fn($a) => $this->inWindow($a->date->toDateString(), $a->time, 60));

        foreach ($events1h as $apt) {
            if ($apt->assignedCoach?->telegram_chat_id) {
                $this->send($token, $apt->assignedCoach->telegram_chat_id,
                    "🔔 [AlJawad] Reminder: Appointment \"{$apt->type_en} — {$apt->client_name}\" is in 1 hour ({$apt->date->toDateString()} at {$apt->time})");
                $apt->update(['notified_1h' => true]);
                $sent++;
            }
        }

        return $sent;
    }

    private function notifyTasks(string $token): int
    {
        $sent = 0;

        $tasks24h = CalendarTask::where('notified_24h', false)->whereNotNull('assigned_coach_id')->get()
            ->filter(fn($t) => $this->inWindow($t->date->toDateString(), $t->time, 24 * 60));

        foreach ($tasks24h as $task) {
            if ($task->assignedCoach?->telegram_chat_id) {
                $this->send($token, $task->assignedCoach->telegram_chat_id,
                    "⏰ [AlJawad] Task reminder: \"{$task->title}\" is due in 24 hours ({$task->date->toDateString()} at {$task->time})");
                $task->update(['notified_24h' => true]);
                $sent++;
            }
        }

        $tasks1h = CalendarTask::where('notified_1h', false)->whereNotNull('assigned_coach_id')->get()
            ->filter(fn($t) => $this->inWindow($t->date->toDateString(), $t->time, 60));

        foreach ($tasks1h as $task) {
            if ($task->assignedCoach?->telegram_chat_id) {
                $this->send($token, $task->assignedCoach->telegram_chat_id,
                    "🔔 [AlJawad] Task reminder: \"{$task->title}\" is due in 1 hour ({$task->date->toDateString()} at {$task->time})");
                $task->update(['notified_1h' => true]);
                $sent++;
            }
        }

        return $sent;
    }

    private function notifyContent(string $token): int
    {
        $sent = 0;

        $content24h = GeneratedContent::where('notified_24h', false)
            ->whereNotNull('scheduled_date')
            ->whereNotNull('assigned_coach_id')
            ->get()
            ->filter(fn($c) => $this->inWindow($c->scheduled_date->toDateString(), $c->scheduled_time ?? '09:00', 24 * 60));

        foreach ($content24h as $item) {
            if ($item->assignedCoach?->telegram_chat_id) {
                $this->send($token, $item->assignedCoach->telegram_chat_id,
                    "⏰ [AlJawad] Content reminder: \"{$item->type} on {$item->platform}\" scheduled in 24 hours ({$item->scheduled_date->toDateString()})");
                $item->update(['notified_24h' => true]);
                $sent++;
            }
        }

        $content1h = GeneratedContent::where('notified_1h', false)
            ->whereNotNull('scheduled_date')
            ->whereNotNull('assigned_coach_id')
            ->get()
            ->filter(fn($c) => $this->inWindow($c->scheduled_date->toDateString(), $c->scheduled_time ?? '09:00', 60));

        foreach ($content1h as $item) {
            if ($item->assignedCoach?->telegram_chat_id) {
                $this->send($token, $item->assignedCoach->telegram_chat_id,
                    "🔔 [AlJawad] Content reminder: \"{$item->type} on {$item->platform}\" scheduled in 1 hour ({$item->scheduled_date->toDateString()})");
                $item->update(['notified_1h' => true]);
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Check if the event datetime falls within a ±10 minute window of $minutesFromNow.
     */
    private function inWindow(string $date, string $time, int $minutesFromNow): bool
    {
        $eventAt  = Carbon::parse("{$date} {$time}");
        $target   = now()->addMinutes($minutesFromNow);
        $diff     = abs($eventAt->diffInMinutes($target, false));
        return $diff <= 10;
    }

    private function send(string $token, string $chatId, string $text): void
    {
        try {
            Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text'    => $text,
            ]);
        } catch (\Throwable $e) {
            Log::error('CalendarNotify send failed', ['chat_id' => $chatId, 'error' => $e->getMessage()]);
        }
    }
}
