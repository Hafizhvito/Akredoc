<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'nullable|string',
            'role' => 'nullable|string',
            'scheduled_at' => 'nullable|date'
        ]);

        if (!in_array(Auth::user()->role, ['GKM', 'Kaprodi'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event = Event::create(array_merge($validated, [
            'user_id' => Auth::id()
        ]));

        $users = \App\Models\User::all();
        foreach ($users as $user) {
            Notification::create([
                'title' => $validated['title'],
                'message' => $validated['message'] ?? Auth::user()->name . ' created event: ' . $event->title,
                'type' => 'event',
                'role' => $validated['role'],
                'user_id' => $user->id,
                'event_id' => $event->id,
                'is_read' => false,
                'scheduled_at' => $validated['scheduled_at'] ?? now()
            ]);
        }

        return response()->json([
            'event' => $event,
            'message' => 'Notifications created successfully'
        ], 201);
    }

    public function index()
    {
        $notifications = Notification::with('event')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($notifications);
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update(['is_read' => true]);
        return response()->json($notification);
    }

    public function getUnreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}