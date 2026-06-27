<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Registration;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegistrationController extends Controller
{
    /**
     * GET /api/admin/registrations
     * All course enrolments with client + course info.
     */
    public function index()
    {
        $regs = Registration::with('course')
            ->orderByDesc('registration_date')
            ->orderByDesc('id')
            ->get();

        $clients = Client::with('user')
            ->whereIn('id', $regs->pluck('student_id')->unique())
            ->get()
            ->keyBy('id');

        $data = $regs->map(fn (Registration $r) => $this->format($r, $clients->get($r->student_id)));

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/admin/registrations
     * Enrol a client in a course. Creates the Student record if missing and
     * promotes a lead to a client on first enrolment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id'         => 'required|exists:clients,id',
            'course_id'         => 'required|exists:courses,id',
            'payment_status'    => 'nullable|in:pending,paid,partial,refunded',
            'amount_paid'       => 'nullable|numeric|min:0',
            'status'            => 'nullable|in:active,completed,cancelled',
            'registration_date' => 'nullable|date',
        ]);

        $client = Client::with('user')->findOrFail($validated['client_id']);

        // Reject duplicates up front (also enforced by a unique DB index).
        $exists = Registration::where('student_id', $client->id)
            ->where('course_id', $validated['course_id'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'This client is already enrolled in this course.'], 422);
        }

        $registration = DB::transaction(function () use ($validated, $client) {
            // Students share their primary key with the client row.
            Student::firstOrCreate(
                ['id' => $client->id],
                ['enrollment_date' => now()->toDateString(), 'status' => 'active'],
            );

            // First enrolment promotes a lead into a paying client.
            if ($client->type === 'lead') {
                $client->convertToClient();
            }

            $registration = Registration::create([
                'student_id'        => $client->id,
                'course_id'         => $validated['course_id'],
                'payment_status'    => $validated['payment_status'] ?? 'pending',
                'amount_paid'       => $validated['amount_paid'] ?? 0,
                'registration_date' => $validated['registration_date'] ?? now()->toDateString(),
                'status'            => $validated['status'] ?? 'active',
            ]);

            $this->syncCoursesCount($client->id);

            return $registration;
        });

        return response()->json(['data' => $this->format($registration->load('course'), $client->fresh('user'))], 201);
    }

    /**
     * PUT /api/admin/registrations/{registration}
     * Update enrolment status / payment.
     */
    public function update(Request $request, Registration $registration)
    {
        $validated = $request->validate([
            'payment_status'    => 'sometimes|in:pending,paid,partial,refunded',
            'amount_paid'       => 'sometimes|numeric|min:0',
            'status'            => 'sometimes|in:active,completed,cancelled',
            'registration_date' => 'sometimes|date',
        ]);

        $registration->update($validated);

        $client = Client::with('user')->find($registration->student_id);

        return response()->json(['data' => $this->format($registration->load('course'), $client)]);
    }

    /**
     * DELETE /api/admin/registrations/{registration}
     */
    public function destroy(Registration $registration)
    {
        $studentId = $registration->student_id;
        $registration->delete();
        $this->syncCoursesCount($studentId);

        return response()->json(['message' => 'Deleted']);
    }

    /** Keep the client's cached courses_count in sync with their registrations. */
    private function syncCoursesCount(int $clientId): void
    {
        Client::where('id', $clientId)->update([
            'courses_count' => Registration::where('student_id', $clientId)->count(),
        ]);
    }

    private function format(Registration $r, ?Client $client): array
    {
        return [
            'id'                => $r->id,
            'client_id'         => $r->student_id,
            'client_name'       => $client?->user?->name,
            'course_id'         => $r->course_id,
            'course_title_ar'   => $r->course?->title_ar ?? $r->course?->title,
            'course_title_en'   => $r->course?->title_en ?? $r->course?->title,
            'status'            => $r->status,
            'payment_status'    => $r->payment_status,
            'amount_paid'       => (float) $r->amount_paid,
            'registration_date' => optional($r->registration_date)->toDateString(),
            'created_at'        => $r->created_at,
        ];
    }
}
