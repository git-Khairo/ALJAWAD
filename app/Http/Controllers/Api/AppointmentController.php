<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        return response()->json(['data' => $query->orderBy('date')->orderBy('time')->get()]);
    }

    public function show(Appointment $appointment)
    {
        return response()->json(['data' => $appointment]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id'   => 'nullable|exists:clients,id',
            'client_name' => 'required|string|max:255',
            'type_ar'     => 'nullable|string',
            'type_en'     => 'nullable|string',
            'date'        => 'required|date',
            'time'        => 'required|string',
            'status'      => 'nullable|in:pending,confirmed,completed,cancelled',
            'notes'       => 'nullable|string',
        ]);

        $appointment = Appointment::create($validated);
        return response()->json(['data' => $appointment], 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'client_id'   => 'nullable|exists:clients,id',
            'client_name' => 'sometimes|string|max:255',
            'type_ar'     => 'nullable|string',
            'type_en'     => 'nullable|string',
            'date'        => 'sometimes|date',
            'time'        => 'sometimes|string',
            'status'      => 'nullable|in:pending,confirmed,completed,cancelled',
            'notes'       => 'nullable|string',
        ]);

        $appointment->update($validated);
        return response()->json(['data' => $appointment]);
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
