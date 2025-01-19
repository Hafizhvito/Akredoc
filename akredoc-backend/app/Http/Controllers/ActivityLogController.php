<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    public function logActivity(Request $request)
    {
        $request->validate([
            'action' => 'required|string',
            'action_type' => 'required|string',
            'action_id' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $user = auth()->user();
        $ipAddress = $request->ip();
        
        // Create a new activity log entry
        $activityLog = ActivityLog::create([
            'user_id' => $user->id,
            'action' => $request->action,
            'action_type' => $request->action_type,
            'action_id' => $request->action_id,
            'description' => $request->description,
            'ip_address' => $ipAddress,
        ]);

        return response()->json(['message' => 'Activity logged successfully', 'data' => $activityLog]);
    }
}
