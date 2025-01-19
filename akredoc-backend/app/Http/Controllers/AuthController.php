<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\{
    Auth, Hash, Log, DB, Mail, Validator
};
use Illuminate\Support\{Str, Carbon};
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AuthController extends Controller
{
    // Allowed user roles
    private const ALLOWED_ROLES = [
        'GKM', 'Kaprodi', 'Sekretaris Prodi', 'Dekan',
        'Wakil Dekan 1', 'Wakil Dekan 2', 
        'Wakil Dekan 3', 'Tendik', 'Admin'
    ];

    /**
     * Log user activities with comprehensive error handling
     */
    private function logActivity(
        int $userId, 
        string $action, 
        string $actionType = 'auth', 
        ?int $actionId = null, 
        ?string $description = null
    ): void {
        try {
            ActivityLog::create([
                'user_id' => $userId,
                'action' => $action,
                'action_type' => $actionType,
                'action_id' => $actionId,
                'description' => $description ?? $action,
                'ip_address' => request()->ip()
            ]);
        } catch (\Exception $e) {
            Log::error("Activity Log Failed: User ID {$userId} - {$e->getMessage()}");
        }
    }

    /**
     * Handle standard error responses
     */
    private function errorResponse(
        string $message, 
        int $statusCode = HttpResponse::HTTP_INTERNAL_SERVER_ERROR, 
        ?array $errors = null
    ): \Illuminate\Http\JsonResponse {
        $response = ['message' => $message];
        if ($errors) $response['errors'] = $errors;
        return response()->json($response, $statusCode);
    }
    
    public function login(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8',
            'remember_me' => 'boolean' // Add validation for remember_me
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed', 
                HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 
                $validator->errors()->toArray()
            );
        }

        if (!Auth::attempt($request->only('name', 'password'))) {
            Log::warning("Failed Login Attempt: {$request->name}");
            return $this->errorResponse(
                'Invalid credentials', 
                HttpResponse::HTTP_UNAUTHORIZED
            );
        }

        $user = User::where('name', $request->name)->firstOrFail();

        if (!in_array($user->role, self::ALLOWED_ROLES)) {
            Log::warning("Access Denied: {$user->name} with role {$user->role}");
            return $this->errorResponse(
                'Your role does not have access. Contact admin.', 
                HttpResponse::HTTP_FORBIDDEN
            );
        }

        // Set token expiration based on remember me
        $tokenExpiration = $request->remember_me ? now()->addMonths(1) : now()->addHours(24);
        $token = $user->createToken('auth-token', ['*'], $tokenExpiration)->plainTextToken;

        // If remember me is checked, create a remember token
        if ($request->remember_me) {
            $rememberToken = Str::random(60);
            $user->remember_token = $rememberToken;
            $user->save();
        }

        $this->logActivity(
            $user->id, 
            'User Login', 
            'auth', 
            null, 
            "Login successful with role: {$user->role}" . ($request->remember_me ? ' (Remember Me enabled)' : '')
        );

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'role' => $user->role,
            'remember_token' => $request->remember_me ? $rememberToken : null
        ]);

    } catch (\Exception $e) {
        Log::error('Login Error: ' . $e->getMessage());
        return $this->errorResponse('Login failed');
    }
}

// Add a new method to handle automatic login with remember token
public function loginWithRememberToken(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'remember_token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Invalid remember token', HttpResponse::HTTP_UNAUTHORIZED);
        }

        $user = User::where('remember_token', $request->remember_token)->first();

        if (!$user) {
            return $this->errorResponse('Invalid remember token', HttpResponse::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('auth-token', ['*'], now()->addMonths(1))->plainTextToken;

        return response()->json([
            'message' => 'Auto login successful',
            'token' => $token,
            'role' => $user->role
        ]);

    } catch (\Exception $e) {
        Log::error('Auto Login Error: ' . $e->getMessage());
        return $this->errorResponse('Auto login failed');
    }
}

    public function logout(Request $request)
{
    try {
        $user = $request->user();

        // Log the activity
        $this->logActivity(
            $user->id,
            'User Logout',
            'auth',
            null,
            "Logged out from {$request->ip()}"
        );

        // Delete the current API token
        $request->user()->currentAccessToken()->delete();
        
        // If the user had a "Remember Me" token, clear it as well
        if ($user->remember_token) {
            $user->remember_token = null;
            $user->save();
        }

        return response()->json(['message' => 'Successfully logged out']);
    } catch (\Exception $e) {
        Log::error('Logout Error: ' . $e->getMessage());
        return $this->errorResponse('Logout failed');
    }
}

    
    /**
     * Check authentication status and token validity
     */
     

    public function checkAuth(Request $request) 
{
    try {
        // Cek apakah user terautentikasi
        if (!$request->user()) {
            return response()->json([
                'authenticated' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        // Ambil user data yang diperlukan
        $userData = $request->user()->only(['name', 'role', 'id']); // Tambahkan role dan id

        return response()->json([
            'authenticated' => true,
            'user' => $userData,
            'role' => $request->user()->role // Explicitly include role
        ], 200);

    } catch (\Exception $e) {
        // Log error dengan detail yang lebih baik
        Log::error('Auth Check Error:', [
            'message' => $e->getMessage(),
            'user_id' => $request->user() ? $request->user()->id : 'no_user',
            'request_path' => $request->path(),
            'request_method' => $request->method(),
            'trace' => $e->getTraceAsString() // Tambahkan stack trace untuk debugging
        ]);

        return response()->json([
            'authenticated' => false,
            'message' => 'Authentication check failed: ' . $e->getMessage()
        ], 500);
    }
} 

    /**
     * Create new user with strict validation and token generation
     */
    public function createUser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255', Rule::unique('users', 'name')],
                'email' => ['required', 'string', 'email', 'max:255'],
                'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/',
                'role' => ['required', 'string', 'max:255', Rule::in(self::ALLOWED_ROLES)],
            ], [
                'name.unique' => 'Username already taken.',
                'password.regex' => 'Password complexity requirements not met.'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse(
                    'Validation failed', 
                    HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 
                    $validator->errors()->toArray()
                );
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);

            $token = $user->createToken('auth-token', ['*'], now()->addHours(24))->plainTextToken;

            $this->logActivity(
                $user->id, 
                'User Creation', 
                'user_management', 
                $user->id, 
                "User created with role: {$user->role}"
            );

            return response()->json([
                'message' => 'User created successfully',
                'user' => $user->only(['name', 'email', 'role']),
                'token' => $token,
            ], HttpResponse::HTTP_CREATED);

        } catch (\Exception $e) {
            Log::error("User Creation Failed: {$e->getMessage()}");
            return $this->errorResponse('User creation failed');
        }
    }

    /**
     * Password reset functionality with token validation
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required',
                'email' => 'required|email',
                'password' => 'required|confirmed|min:8',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse(
                    'Validation failed', 
                    HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 
                    $validator->errors()->toArray()
                );
            }

            $resetRecord = DB::table('password_reset_tokens')
                ->where('token', $request->token)
                ->where('email', $request->email)
                ->first();

            if (!$resetRecord || Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
                DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->delete();

                return $this->errorResponse(
                    'Invalid or expired reset token', 
                    HttpResponse::HTTP_BAD_REQUEST
                );
            }

            $user = User::where('email', $request->email)->firstOrFail();
            $user->update(['password' => Hash::make($request->password)]);

            $this->logActivity(
                $user->id,
                'Password Reset',
                'auth',
                null,
                'Password successfully reset'
            );

            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            return response()->json(['message' => 'Password reset successfully']);

        } catch (\Exception $e) {
            Log::error('Password Reset Error: ' . $e->getMessage());
            return $this->errorResponse('Password reset failed');
        }
    }

    /**
     * Send password reset link via email
     */
    
    public function sendResetLink(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'user_id' => 'required|exists:users,id'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed', 
                HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 
                $validator->errors()->toArray()
            );
        }

        $user = User::where('id', $request->user_id)
                    ->where('email', $request->email)
                    ->first();

        if (!$user) {
            return $this->errorResponse('User not found or email does not match');
        }

        $token = Str::random(64);
        
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $token,
                'created_at' => Carbon::now()
            ]
        );

        $resetUrl = 'https://akredoc.my.id/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        Mail::send('emails.reset-password', 
            ['resetUrl' => $resetUrl, 'name' => $user->name], 
            function($message) use ($request) {
                $message->to($request->email)
                        ->subject('Password Reset Notification');
            }
        );

        return response()->json([
            'message' => 'Password reset link has been sent successfully.'
        ]);

    } catch (\Exception $e) {
        Log::error('Reset Link Error: ' . $e->getMessage());
        return $this->errorResponse('Password reset link generation failed');
    }
}

public function checkEmailUsers(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed', 
                HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 
                $validator->errors()->toArray()
            );
        }

        $users = User::where('email', $request->email)
                    ->select('id', 'name', 'email', 'role')
                    ->get();

        return response()->json([
            'users' => $users
        ]);

    } catch (\Exception $e) {
        Log::error('Check Email Users Error: ' . $e->getMessage());
        return $this->errorResponse('Gagal memeriksa email');
    }
}

}