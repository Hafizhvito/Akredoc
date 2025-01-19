<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Notification;
use App\Models\ActivityLog;
use App\Http\Controllers\NotificationController;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::with('user')->get();
        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'color' => 'nullable|string'
        ]);

        $event = Event::create(array_merge($validated, ['user_id' => Auth::id()]));

        ActivityLog::create([
            'user_id' => $event->user_id,
            'action' => 'create',
            'action_type' => 'Event',
            'action_id' => $event->id,
            'description' => "Event '{$event->title}' telah dibuat oleh {$event->user->name}.",
            'ip_address' => $request->ip(),
        ]);

        // Buat notifikasi untuk semua user
        $users = \App\Models\User::all();
        foreach ($users as $user) {
            Notification::create([
                'title' => 'New Event: ' . $event->title,
                'message' => "Event baru telah dijadwalkan untuk " . 
                            Carbon::parse($event->start_date)->format('M d, Y H:i') .
                            " oleh " . Auth::user()->name,
                'type' => 'event',
                'user_id' => $user->id,
                'event_id' => $event->id,
                'is_read' => false,
                'scheduled_at' => $event->start_date
            ]);
        }

        return response()->json($event, 201);
    }

    public function update(Request $request, Event $event)
    {
        $this->authorize('update', $event);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'color' => 'nullable|string'
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function destroy(Event $event)
    {
        $this->authorize('delete', $event);
        $event->delete();

        return response()->json(null, 204);
    }
}