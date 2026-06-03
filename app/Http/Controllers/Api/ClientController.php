<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        $type = $request->get('type', 'all');
        if ($type === 'client') {
            $query->clients();
        } elseif ($type === 'lead') {
            $query->leads();
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")
                   ->orWhere('email', 'like', "%$q%")
                   ->orWhere('phone', 'like', "%$q%");
            });
        }

        return response()->json(['data' => $query->orderByDesc('id')->get()]);
    }

    public function show(Client $client)
    {
        return response()->json(['data' => $client]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'email'  => 'required|email|unique:clients,email',
            'phone'  => 'nullable|string',
            'type'   => 'required|in:client,lead',
            'status' => 'nullable|in:active,inactive',
            'source' => 'nullable|string',
            'notes'  => 'nullable|string',
        ]);

        $client = Client::create($validated);
        return response()->json(['data' => $client], 201);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|email|unique:clients,email,' . $client->id,
            'phone'            => 'nullable|string',
            'type'             => 'sometimes|in:client,lead',
            'status'           => 'nullable|string',
            'source'           => 'nullable|string',
            'notes'            => 'nullable|string',
            'tags'             => 'nullable|array',
            'telegram_chat_id' => 'nullable|string',
            'lead_status'      => 'nullable|string',
            'last_contact'     => 'nullable|date',
            'courses_count'    => 'nullable|integer',
        ]);

        // For leads: if 'status' looks like a lead pipeline status, map it to lead_status
        if ($client->type === 'lead' && isset($validated['status'])) {
            $leadStatuses = ['new', 'contacted', 'interested', 'qualified', 'not_interested', 'converted'];
            if (in_array($validated['status'], $leadStatuses)) {
                $validated['lead_status'] = $validated['status'];
                unset($validated['status']);
            }
        }

        $client->update($validated);
        return response()->json(['data' => $client]);
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function convert(Client $client)
    {
        $client->convertToClient();
        return response()->json(['data' => $client]);
    }
}
