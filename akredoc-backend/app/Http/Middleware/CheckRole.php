<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
{
    if (!Auth::check()) {
        return response()->json(['message' => 'Unauthorized. Please login.'], 401);
    }

    $userRole = Auth::user()->role;

    if (!in_array($userRole, $roles)) {
        Log::warning("Unauthorized access attempt by user with role: {$userRole}");
        return response()->json([
            'message' => 'Access denied. Your role does not have permission.',
            'user_role' => $userRole,
            'required_roles' => $roles
        ], 403);
    }

    return $next($request);
}
}