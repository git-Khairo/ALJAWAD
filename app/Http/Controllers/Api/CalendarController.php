<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CalendarTask;
use App\Models\GeneratedContent;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * GET /api/admin/calendar
     * Returns all calendar events merged: appointments + tasks + content items.
     */
    public function index()
    {
        $appointments = Appointment::with('assignedCoach:id,name,telegram_chat_id')
            ->get()
            ->map(fn($a) => [
                'id'             => $a->id,
                'type'           => 'appointment',
                'title'          => $a->type_en . ' — ' . $a->client_name,
                'title_ar'       => $a->type_ar . ' — ' . $a->client_name,
                'date'           => $a->date->toDateString(),
                'time'           => $a->time,
                'status'         => $a->status,
                'notes'          => $a->notes,
                'assigned_coach' => $a->assignedCoach ? [
                    'id'               => $a->assignedCoach->id,
                    'name'             => $a->assignedCoach->name,
                    'telegram_chat_id' => $a->assignedCoach->telegram_chat_id,
                ] : null,
            ]);

        $tasks = CalendarTask::with('assignedCoach:id,name,telegram_chat_id')
            ->get()
            ->map(fn($t) => [
                'id'             => $t->id,
                'type'           => 'task',
                'title'          => $t->title,
                'title_ar'       => $t->title,
                'date'           => $t->date->toDateString(),
                'time'           => $t->time,
                'status'         => $t->status,
                'priority'       => $t->priority,
                'notes'          => $t->notes,
                'assigned_coach' => $t->assignedCoach ? [
                    'id'               => $t->assignedCoach->id,
                    'name'             => $t->assignedCoach->name,
                    'telegram_chat_id' => $t->assignedCoach->telegram_chat_id,
                ] : null,
            ]);

        $content = GeneratedContent::with('assignedCoach:id,name,telegram_chat_id')
            ->whereNotNull('scheduled_date')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'type'           => 'content',
                'title'          => ucfirst($c->type) . ' — ' . $c->platform,
                'title_ar'       => $c->type . ' — ' . $c->platform,
                'date'           => $c->scheduled_date->toDateString(),
                'time'           => $c->scheduled_time ?? '09:00',
                'status'         => $c->status,
                'notes'          => null,
                'assigned_coach' => $c->assignedCoach ? [
                    'id'               => $c->assignedCoach->id,
                    'name'             => $c->assignedCoach->name,
                    'telegram_chat_id' => $c->assignedCoach->telegram_chat_id,
                ] : null,
            ]);

        return response()->json([
            'data' => $appointments->concat($tasks)->concat($content)->values(),
        ]);
    }

    /**
     * POST /api/admin/calendar/tasks
     */
    public function storeTask(Request $request)
    {
        $data = $request->validate([
            'title'             => 'required|string|max:255',
            'date'              => 'required|date',
            'time'              => 'required|date_format:H:i',
            'assigned_coach_id' => 'nullable|exists:users,id',
            'priority'          => 'in:low,medium,high',
            'status'            => 'in:pending,done',
            'notes'             => 'nullable|string',
        ]);

        $task = CalendarTask::create($data);
        $task->load('assignedCoach:id,name,telegram_chat_id');

        return response()->json(['data' => $task], 201);
    }

    /**
     * PUT /api/admin/calendar/tasks/{task}
     */
    public function updateTask(Request $request, CalendarTask $task)
    {
        $data = $request->validate([
            'title'             => 'sometimes|string|max:255',
            'date'              => 'sometimes|date',
            'time'              => 'sometimes|date_format:H:i',
            'assigned_coach_id' => 'nullable|exists:users,id',
            'priority'          => 'sometimes|in:low,medium,high',
            'status'            => 'sometimes|in:pending,done',
            'notes'             => 'nullable|string',
        ]);

        $task->update($data);

        return response()->json(['data' => $task->fresh('assignedCoach')]);
    }

    /**
     * DELETE /api/admin/calendar/tasks/{task}
     */
    public function destroyTask(CalendarTask $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted.']);
    }
}
