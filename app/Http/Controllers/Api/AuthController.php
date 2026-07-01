<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Services\LoginCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private LoginCodeService $codes) {}

    /**
     * Login with an identifier that is either an email (staff) or a phone
     * number (clients) + password. Unclaimed phone accounts are sent to the
     * claim flow instead of failing.
     */
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password'   => 'required|string',
        ]);

        $identifier = trim($request->identifier);

        if (str_contains($identifier, '@')) {
            // ── Email path (staff/admin) ──
            if (! Auth::attempt(['email' => $identifier, 'password' => $request->password])) {
                throw ValidationException::withMessages(['identifier' => ['The provided credentials are incorrect.']]);
            }
        } else {
            // ── Phone path (clients) ──
            $phone = User::normalizePhone($identifier);
            $user  = $phone ? User::where('phone', $phone)->first() : null;

            if (! $user) {
                throw ValidationException::withMessages(['identifier' => ['The provided credentials are incorrect.']]);
            }
            if (! $user->hasUsablePassword()) {
                return response()->json([
                    'message'     => 'This account has not been set up yet. Claim it to set a password.',
                    'needs_claim' => true,
                    'phone'       => $phone,
                ], 409);
            }
            if (! Auth::attempt(['phone' => $phone, 'password' => $request->password])) {
                throw ValidationException::withMessages(['identifier' => ['The provided credentials are incorrect.']]);
            }
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
     * Self-registration from the website. Phone is the unique identity.
     * If the phone already exists, route the user to claim (unclaimed) or
     * sign in (already registered). Creates an inactive-client CRM record.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'phone'             => 'required|string|max:20',
            'email'             => 'nullable|email|unique:users,email',
            'password'          => 'required|string|min:8|confirmed',
            'telegram_chat_id'  => 'nullable|string|max:100',
            'referred_by_code'  => 'nullable|string|exists:users,affiliate_code',
        ]);

        $phone = User::normalizePhone($request->phone);
        if (! $phone) {
            throw ValidationException::withMessages(['phone' => ['Please enter a valid phone number.']]);
        }

        $existing = User::where('phone', $phone)->first();
        if ($existing) {
            if (! $existing->hasUsablePassword()) {
                return response()->json([
                    'message'     => 'An account with this phone already exists. Claim it to set your password.',
                    'needs_claim' => true,
                    'phone'       => $phone,
                ], 409);
            }
            return response()->json([
                'message' => 'This phone number is already registered. Please sign in.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $phone) {
            $referredBy = null;
            if ($request->filled('referred_by_code')) {
                $referredBy = User::where('affiliate_code', $request->referred_by_code)->first();
            }

            $user = User::create([
                'name'                => $request->name,
                'email'               => $request->email,
                'phone'               => $phone,
                'password'            => Hash::make($request->password),
                'password_set_at'     => now(),
                'telegram_chat_id'    => $request->telegram_chat_id,
                'referred_by_user_id' => $referredBy?->id,
                'user_type'           => 'client',
                'is_active'           => true,
            ]);

            // Registering opens an account → they start as an inactive client
            // (no money yet). Auto-activates on their first deposit / paid plan.
            Client::create([
                'user_id' => $user->id,
                'stage'   => 'client_inactive',
                'source'  => 'website',
            ]);

            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user'  => $this->formatUser($user->load('client')),
            ], 201);
        });
    }

    /**
     * POST /auth/request-code — send a one-time claim/reset code to the phone's
     * owner via Telegram (or signal that support must hand it over).
     */
    public function requestCode(Request $request)
    {
        $request->validate(['phone' => 'required|string|max:20']);

        $phone = User::normalizePhone($request->phone);
        $user  = $phone ? User::where('phone', $phone)->first() : null;

        if (! $user) {
            return response()->json(['message' => 'No account found for this phone number. Please sign up.'], 404);
        }

        $sentVia = $this->codes->issue($user)['sent_via'];

        return response()->json([
            'message'  => $sentVia === 'telegram'
                ? 'A code has been sent to your Telegram.'
                : 'Please contact support to receive your access code.',
            'sent_via' => $sentVia,
        ]);
    }

    /**
     * POST /auth/claim — verify a one-time code, set the password, and log in.
     * Used for first-time setup of admin-created accounts and password resets.
     */
    public function claim(Request $request)
    {
        $request->validate([
            'phone'    => 'required|string|max:20',
            'code'     => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $phone = User::normalizePhone($request->phone);
        $user  = $phone ? User::where('phone', $phone)->first() : null;

        if (! $user) {
            return response()->json(['message' => 'No account found for this phone number.'], 404);
        }

        $loginCode = $user->loginCodes()
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $loginCode || ! Hash::check($request->code, $loginCode->code_hash)) {
            throw ValidationException::withMessages(['code' => ['The code is invalid or has expired.']]);
        }

        $user->update([
            'password'        => Hash::make($request->password),
            'password_set_at' => now(),
        ]);
        $loginCode->update(['consumed_at' => now()]);

        // Fresh session: revoke old tokens, issue a new one.
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user->fresh()),
        ]);
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
            'created_at'       => $user->created_at,
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
