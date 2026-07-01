<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoursePlan;
use App\Models\CourseRequest;
use App\Services\CourseAccessService;
use Illuminate\Http\Request;

class CourseRequestController extends Controller
{
    public function __construct(private CourseAccessService $access) {}

    /**
     * POST /api/my/course-requests
     * Authenticated user applies for a course plan.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_plan_id' => 'required|exists:course_plans,id',
        ]);

        $user = $request->user();

        // Block duplicates while a request is still open or already accepted.
        $existing = CourseRequest::where('user_id', $user->id)
            ->where('course_plan_id', $validated['course_plan_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => $existing->status === 'approved'
                    ? 'You already have access to this plan.'
                    : 'You already have a pending request for this plan.',
                'data'    => $this->formatMine($existing->load('coursePlan')),
            ], 422);
        }

        $req = CourseRequest::create([
            'user_id'        => $user->id,
            'course_plan_id' => $validated['course_plan_id'],
            'status'         => 'pending',
        ]);

        return response()->json(['data' => $this->formatMine($req->load('coursePlan'))], 201);
    }

    /**
     * GET /api/my/course-requests
     * The authenticated user's own requests (for tracking on the dashboard).
     */
    public function mine(Request $request)
    {
        $rows = CourseRequest::with('coursePlan')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CourseRequest $r) => $this->formatMine($r));

        return response()->json(['data' => $rows]);
    }

    /**
     * GET /api/admin/course-requests
     * All requests for the Course Manager (pending first).
     */
    public function index()
    {
        $rows = CourseRequest::with(['coursePlan', 'user'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CourseRequest $r) => $this->formatAdmin($r));

        return response()->json(['data' => $rows]);
    }

    /**
     * PUT /api/admin/course-requests/{courseRequest}
     * Approve or decline a pending request.
     */
    public function update(Request $request, CourseRequest $courseRequest)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $courseRequest->update([
            'status'      => $validated['status'],
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        $courseRequest->load(['coursePlan', 'user']);

        $extra = [];

        if ($validated['status'] === 'approved') {
            $user = $courseRequest->user;
            $plan = $courseRequest->coursePlan;

            // Approving means they paid for a plan → activate their CRM record.
            $user?->client?->activate();

            $chatId = $this->numericChatId($user?->telegram_chat_id);

            if (! $plan?->bot_plan) {
                // Plan isn't linked to a bot plan yet — admin must configure it.
                $extra['needs_bot_plan'] = true;
            } elseif (! $chatId) {
                // No usable (numeric) Telegram ID — admin adds it in Manage Access.
                $extra['needs_telegram'] = true;
                $extra['grant_context']  = [
                    'user_id'        => $user?->id,
                    'user_name'      => $user?->name,
                    'course_plan_id' => $plan->id,
                ];
            } else {
                // Auto-grant via the bot for the plan's fixed access period.
                $result = $this->access->grant($plan, $chatId, (int) $plan->access_days, $user->id);
                $extra['auto_granted'] = true;
                $extra['invite_links'] = $result['invite_links'];
                $extra['bot_result']   = $result['bot_result'];
            }
        }

        return response()->json(array_merge(['data' => $this->formatAdmin($courseRequest)], $extra));
    }

    /** Normalize a stored telegram_chat_id to a numeric chat id the bot can use, or null. */
    private function numericChatId(?string $raw): ?int
    {
        if ($raw === null) {
            return null;
        }
        $raw = ltrim(trim($raw), '@');

        return ctype_digit($raw) ? (int) $raw : null;
    }

    private function formatMine(CourseRequest $r): array
    {
        return [
            'id'                => $r->id,
            'course_plan_id'    => $r->course_plan_id,
            'plan_name_ar'      => $r->coursePlan?->name_ar,
            'plan_name_en'      => $r->coursePlan?->name_en,
            'plan_subtitle_ar'  => $r->coursePlan?->subtitle_ar,
            'plan_subtitle_en'  => $r->coursePlan?->subtitle_en,
            'plan_access_ar'    => $r->coursePlan?->access_ar,
            'plan_access_en'    => $r->coursePlan?->access_en,
            'plan_price'        => $r->coursePlan?->price,
            'plan_currency'     => $r->coursePlan?->currency,
            'status'            => $r->status,
            'created_at'        => $r->created_at,
            'reviewed_at'       => $r->reviewed_at,
        ];
    }

    private function formatAdmin(CourseRequest $r): array
    {
        $user = $r->user;

        return [
            'id'               => $r->id,
            'user_id'          => $r->user_id,
            'user_name'        => $user?->name,
            'user_email'       => $user?->email,
            'telegram_chat_id' => $user?->telegram_chat_id,
            'has_telegram'     => ! empty($user?->telegram_chat_id),
            'course_plan_id'   => $r->course_plan_id,
            'plan_name_ar'     => $r->coursePlan?->name_ar,
            'plan_name_en'     => $r->coursePlan?->name_en,
            'bot_plan'         => $r->coursePlan?->bot_plan,
            'status'           => $r->status,
            'created_at'       => $r->created_at,
            'reviewed_at'      => $r->reviewed_at,
        ];
    }
}
