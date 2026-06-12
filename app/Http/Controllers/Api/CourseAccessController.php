<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoursePlan;
use App\Models\CourseAccessGrant;
use App\Models\User;
use App\Services\TelegramBotService;
use Illuminate\Http\Request;

class CourseAccessController extends Controller
{
    public function __construct(private TelegramBotService $bot) {}

    /**
     * GET /api/admin/courses/all-grants
     * All grants across every course plan.
     */
    public function allGrants()
    {
        $grants = CourseAccessGrant::with(['user:id,name,email', 'coursePlan:id,name_ar,name_en,bot_plan'])
            ->latest()
            ->get()
            ->map(fn($g) => $this->format($g));

        return response()->json(['data' => $grants]);
    }

    /**
     * GET /api/admin/courses/{coursePlan}/access-grants
     */
    public function index(CoursePlan $coursePlan)
    {
        $grants = $coursePlan->accessGrants()
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn($g) => $this->format($g));

        return response()->json(['data' => $grants]);
    }

    /**
     * POST /api/admin/courses/{coursePlan}/access-grants
     * Body: { telegram_chat_id: int, access_days: int, user_id?: int (optional, links to our user) }
     */
    public function store(Request $request, CoursePlan $coursePlan)
    {
        $data = $request->validate([
            'telegram_chat_id' => 'required|integer',
            'access_days'      => 'required|integer|min:1|max:3650',
            'user_id'          => 'nullable|exists:users,id',
        ]);

        if (! $coursePlan->bot_plan) {
            return response()->json(['message' => 'This course plan has no bot plan configured (beginner / intermediate / expert).'], 422);
        }

        $telegramChatId = (int) $data['telegram_chat_id'];
        $accessDays     = (int) $data['access_days'];
        $expiresAt      = now()->addDays($accessDays);

        $grant = CourseAccessGrant::updateOrCreate(
            ['course_plan_id' => $coursePlan->id, 'telegram_chat_id' => (string) $telegramChatId],
            [
                'user_id'    => $data['user_id'] ?? null,
                'bot_plan'   => $coursePlan->bot_plan,
                'granted_at' => now(),
                'expires_at' => $expiresAt,
                'revoked_at' => null,
                'status'     => 'active',
            ]
        );

        $botResult = $this->bot->grantAccess($telegramChatId, $coursePlan->bot_plan, $accessDays);

        if (! empty($botResult['invite_links'])) {
            $grant->update(['invite_links' => $botResult['invite_links']]);
        }

        return response()->json([
            'data'         => $this->format($grant->fresh('user')),
            'bot_result'   => $botResult,
            'invite_links' => $botResult['invite_links'] ?? [],
        ], 201);
    }

    /**
     * DELETE /api/admin/courses/{coursePlan}/access-grants/{grantId}
     * Revokes by grant ID (not user ID, since grants are now keyed by telegram_chat_id).
     */
    public function destroy(CoursePlan $coursePlan, int $grantId)
    {
        $grant = CourseAccessGrant::where('course_plan_id', $coursePlan->id)
            ->where('id', $grantId)
            ->firstOrFail();

        $grant->update(['revoked_at' => now(), 'status' => 'revoked']);

        $this->bot->revokeAccess((int) $grant->telegram_chat_id);

        return response()->json(['message' => 'Access revoked.']);
    }

    /**
     * PATCH /api/admin/courses/{coursePlan}/access-grants/{grantId}
     * Extend a grant by adding N days to its current expiry (or from now if already expired).
     */
    public function extend(Request $request, CoursePlan $coursePlan, int $grantId)
    {
        $data = $request->validate([
            'add_days' => 'required|integer|min:1|max:3650',
        ]);

        $grant = CourseAccessGrant::where('course_plan_id', $coursePlan->id)
            ->where('id', $grantId)
            ->firstOrFail();

        $base      = ($grant->expires_at && $grant->expires_at->isFuture()) ? $grant->expires_at : now();
        $expiresAt = $base->addDays($data['add_days']);
        $daysLeft  = (int) now()->diffInDays($expiresAt, false);

        $grant->update(['expires_at' => $expiresAt, 'status' => 'active', 'revoked_at' => null]);

        // Re-grant at the bot with the remaining days from now
        $botResult = $this->bot->grantAccess((int) $grant->telegram_chat_id, $grant->bot_plan, max(1, $daysLeft));

        if (! empty($botResult['invite_links'])) {
            $grant->update(['invite_links' => $botResult['invite_links']]);
        }

        return response()->json([
            'data'       => $this->format($grant->fresh('user', 'coursePlan')),
            'bot_result' => $botResult,
        ]);
    }

    /**
     * PATCH /api/admin/courses/{coursePlan}/bot-plan
     * Update the bot plan for a course plan (beginner | intermediate | expert).
     */
    public function updateBotPlan(Request $request, CoursePlan $coursePlan)
    {
        $data = $request->validate([
            'bot_plan' => 'nullable|string|in:beginner,intermediate,expert',
        ]);

        $coursePlan->update($data);

        return response()->json(['data' => $coursePlan->fresh()]);
    }

    private function format(CourseAccessGrant $grant): array
    {
        return [
            'id'               => $grant->id,
            'telegram_chat_id' => $grant->telegram_chat_id,
            'bot_plan'         => $grant->bot_plan,
            'course_plan'      => $grant->coursePlan ? [
                'id'       => $grant->coursePlan->id,
                'name_ar'  => $grant->coursePlan->name_ar,
                'name_en'  => $grant->coursePlan->name_en,
                'bot_plan' => $grant->coursePlan->bot_plan,
            ] : null,
            'user'         => $grant->user ? [
                'id'    => $grant->user->id,
                'name'  => $grant->user->name,
                'email' => $grant->user->email,
            ] : null,
            'invite_links' => $grant->invite_links ?? [],
            'granted_at'   => $grant->granted_at?->toDateTimeString(),
            'expires_at'   => $grant->expires_at?->toDateTimeString(),
            'revoked_at'   => $grant->revoked_at?->toDateTimeString(),
            'status'       => $grant->status,
        ];
    }
}
