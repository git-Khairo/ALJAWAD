<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class AccountController extends Controller
{
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
