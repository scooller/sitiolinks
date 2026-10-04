<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManagerCreator;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class MagicLinkController extends Controller
{
    /**
     * Consume un magic-link de 1 uso y loguea al creador.
     * POST /api/auth/magic-link  ó  GET /api/auth/magic-link/{token}
     */
    public function consume(Request $request, ?string $token = null): JsonResponse
    {
        $token = $token ?? $request->input('token');

        if (! $token) {
            return response()->json(['message' => 'Token requerido.'], 422);
        }

        $hashedToken = hash('sha256', $token);

        $user = User::where('magic_link_token', $hashedToken)
            ->where('magic_link_expires_at', '>', now())
            ->firstOrFail();

        if ($user->managedBy && $user->managedBy->status === ManagerCreator::STATUS_INACTIVE) {
            abort(403, 'Esta cuenta ha sido desactivada.');
        }

        // Invalidar el token inmediatamente (1 uso)
        $user->update([
            'magic_link_token' => null,
            'magic_link_expires_at' => null,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Acceso concedido. Por favor establece tu contraseña.',
            'must_set_password' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ],
        ]);
    }

    /**
     * Primer cambio de contraseña tras magic-link login.
     * POST /api/magic-link/set-password
     */
    public function setPassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ], [
            'password.min' => 'La contraseña debe tener al menos 12 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Contraseña establecida correctamente.']);
    }
}
