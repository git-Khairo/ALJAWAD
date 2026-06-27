<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Registration;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * GET /api/my/enrollments
     * The authenticated user's course registrations (read-only — created in
     * the back office). Chain: User → Client → Student(id=client.id) → Registration.
     */
    public function enrollments(Request $request)
    {
        $client = $request->user()->client; // hasOne CRM profile

        // No CRM profile yet → no enrolments. Students share their PK with the
        // client row, so registrations are keyed by the client id.
        if (! $client) {
            return response()->json(['data' => []]);
        }

        $rows = Registration::with('course')
            ->where('student_id', $client->id)
            ->orderByDesc('registration_date')
            ->get()
            ->map(fn (Registration $r) => [
                'id'                => $r->id,
                'course_id'         => $r->course_id,
                'title_ar'          => $r->course?->title_ar ?? $r->course?->title,
                'title_en'          => $r->course?->title_en ?? $r->course?->title,
                'status'            => $r->status,            // active | completed | cancelled
                'payment_status'    => $r->payment_status,    // pending | paid | partial | refunded
                'registration_date' => optional($r->registration_date)->toDateString(),
            ]);

        return response()->json(['data' => $rows]);
    }

    /**
     * GET /api/my/appointments
     * Upcoming appointments for the authenticated user.
     *
     * Matched primarily by the appointment's client_id (set in the admin
     * appointment form). Legacy rows with no client_id fall back to a
     * case-insensitive client_name match against the user's name.
     */
    public function appointments(Request $request)
    {
        $user   = $request->user();
        $client = $user->client;
        $name   = mb_strtolower(trim((string) $user->name));

        // Nothing to match on → no appointments.
        if (! $client && $name === '') {
            return response()->json(['data' => []]);
        }

        $rows = Appointment::query()
            ->where(function ($q) use ($client, $name) {
                if ($client) {
                    $q->where('client_id', $client->id);
                }
                if ($name !== '') {
                    // Legacy fallback: only rows that were never linked.
                    $q->orWhere(function ($q2) use ($name) {
                        $q2->whereNull('client_id')
                           ->whereRaw('LOWER(TRIM(client_name)) = ?', [$name]);
                    });
                }
            })
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(fn (Appointment $a) => [
                'id'      => $a->id,
                'type_ar' => $a->type_ar,
                'type_en' => $a->type_en,
                'date'    => optional($a->date)->toDateString(),
                'time'    => $a->time,
                'status'  => $a->status,
            ]);

        return response()->json(['data' => $rows]);
    }
}
