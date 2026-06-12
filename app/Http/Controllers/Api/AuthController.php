<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    /**
     * Self-registration from the website.
     * Creates a user account and a lead CRM record.
     * Roles are for coaches only — registering clients get no role.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users,email',
            'password'          => 'required|string|min:8|confirmed',
            'phone'             => 'nullable|string|max:20',
            'telegram_chat_id'  => 'nullable|string|max:100',
            'referred_by_code'  => 'nullable|string|exists:users,affiliate_code',
        ]);

        return DB::transaction(function () use ($request) {
            $referredBy = null;
            if ($request->filled('referred_by_code')) {
                $referredBy = User::where('affiliate_code', $request->referred_by_code)->first();
            }

            $user = User::create([
                'name'                => $request->name,
                'email'               => $request->email,
                'password'            => Hash::make($request->password),
                'phone'               => $request->phone,
                'telegram_chat_id'    => $request->telegram_chat_id,
                'referred_by_user_id' => $referredBy?->id,
                'user_type'           => 'client',
                'is_active'           => true,
            ]);

            // Auto-create a lead CRM record — converted to client when they enrol/pay
            Client::create([
                'user_id'     => $user->id,
                'type'        => 'lead',
                'lead_status' => 'new',
                'source'      => 'website',
            ]);

            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user'  => $this->formatUser($user->load('client')),
            ], 201);
        });
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load($request->user()->isCoach() ? 'coach' : 'client');
        return response()->json(['user' => $this->formatUser($user)]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Revoke all other tokens
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'phone'            => 'nullable|string|max:20',
            'telegram_chat_id' => 'nullable|string|max:100',
        ]);

        $request->user()->update($validated);

        return response()->json(['user' => $this->formatUser($request->user()->fresh())]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Reset link sent.']);
        }

        return response()->json(['message' => 'Unable to send reset link.'], 422);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successfully.']);
        }

        return response()->json(['message' => 'Invalid reset token.'], 422);
    }

    // ── Private ───────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        $profile = $user->isCoach() ? $user->coach : $user->client;

        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'telegram_chat_id' => $user->telegram_chat_id,
            'user_type'        => $user->user_type,
            'is_active'        => $user->is_active,
            'affiliate_code'   => $user->affiliate_code,
            'affiliate_balance'=> $user->affiliate_balance,
            'referred_by'      => $user->referredBy?->name,
            'roles'            => $user->getRoleNames(),
            'permissions'      => $user->getAllPermissions()->pluck('name'),
            'profile'          => $profile,
        ];
    }
}
