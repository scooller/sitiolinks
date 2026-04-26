<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Captcha;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|min:3|max:30|unique:users,username|alpha_dash|lowercase',
            'password' => 'required|string|min:12|confirmed',
            'birth_date' => 'required|date|before_or_equal:'.now()->subYears(18)->toDateString(),
            'gender' => 'required|in:hombre,mujer,trans,otro',
            'captcha' => 'nullable|string',
        ], [
            'birth_date.before_or_equal' => 'Debes ser mayor de 18 años.',
            'username.alpha_dash' => 'Solo letras, números, guiones y guiones bajos.',
            'username.lowercase' => 'El nombre de usuario debe estar en minúsculas.',
            'username.unique' => 'Este nombre de usuario ya está en uso.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'password.min' => 'La contraseña debe tener al menos 12 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'captcha.required' => 'Falta el captcha.',
        ]);

        // Verify captcha if enabled
        $provider = config('services.captcha.provider', 'recaptcha');
        $isEnabled = ($provider === 'recaptcha') ? (bool) config('services.recaptcha.enabled') : (bool) config('services.altcha.enabled');

        if ($isEnabled && ! Captcha::verify($request->string('captcha')->toString())) {
            throw ValidationException::withMessages([
                'captcha' => ['Captcha inválido. Intenta nuevamente.'],
            ]);
        }

        // Create user with default role
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'birth_date' => $request->birth_date,
            'gender' => $request->gender,
        ]);

        // Assign default 'user' role
        $user->assignRole('user');

        // Send email verification notification
        $user->sendEmailVerificationNotification();

        // Login user automatically
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registro exitoso.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->getRoleNames(),
                'warning_modal_dismissed' => (bool) $user->warning_modal_dismissed,
            ],
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Login user with session
        Auth::login($user, $request->boolean('remember'));

        // Regenerate session to prevent fixation
        $request->session()->regenerate();

        Log::info('User logged in', [
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
            'has_session' => Auth::check(),
            'cookie_names' => array_keys($request->cookies->all()),
            'cookie_session' => $request->cookies->get(config('session.cookie')),
            'headers_cookie' => $request->headers->get('cookie'),
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->getRoleNames(),
                'warning_modal_dismissed' => (bool) $user->warning_modal_dismissed,
            ],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada exitosamente.']);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        Log::info('Checking auth', [
            'has_user' => $request->user() !== null,
            'auth_check' => Auth::check(),
            'session_id' => $request->session()->getId(),
            'cookie_names' => array_keys($request->cookies->all()),
            'cookie_session' => $request->cookies->get(config('session.cookie')),
            'headers_cookie' => $request->headers->get('cookie'),
        ]);

        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'roles' => $user->getRoleNames(),
                'warning_modal_dismissed' => (bool) $user->warning_modal_dismissed,
            ],
        ]);
    }

    /**
     * Resend email verification notification
     */
    public function resendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'El email ya está verificado.'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de verificación enviado.']);
    }
}
