<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Response;

class ProfileController extends Controller
{
    public function show(Request $request)
{
    try {
        $user = $request->user();
        
        return response()->json([
            'name' => $user->name,
            'role' => $user->role,
            'created_at' => $user->created_at->toDateTimeString()
        ]);
    } catch (\Exception $e) {
        Log::error('Profile show error for user ' . $request->user()->id . ': ' . $e->getMessage());
        return response()->json([
            'message' => 'Error retrieving profile'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}



    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:users,name,' . $request->user()->id],
            'current_password' => ['required_with:new_password'],
            'new_password' => ['nullable', 'string', 'min:8', 'different:current_password']
        ]);

        try {
            $user = $request->user();

            // Handle name update
            if ($request->filled('name')) {
                $user->name = strip_tags($request->name);
            }

            // Handle password update
            if ($request->filled('new_password')) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'message' => 'Current password is incorrect'
                    ], Response::HTTP_UNPROCESSABLE_ENTITY);
                }
                $user->password = Hash::make($request->new_password);
            }

            $user->save();

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => [
                    'name' => $user->name,
                    'role' => $user->role,
                    'updated_at' => $user->updated_at->toDateTimeString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Profile update error for user ' . $request->user()->id . ': ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating profile'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
