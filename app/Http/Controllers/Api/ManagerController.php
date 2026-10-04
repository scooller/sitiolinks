<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Models\CreatorDocument;
use App\Models\ManagerCreator;
use App\Models\ManagerProfile;
use App\Models\Notification;
use App\Models\SiteSettings;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ManagerController extends Controller
{
    // ─── Profile ────────────────────────────────────────────────────────────

    /** GET /api/manager/profile */
    public function getProfile(Request $request): JsonResponse
    {
        $profile = $request->user()->managerProfile()->with(['cafe', 'creators.creator'])->first();

        if (! $profile) {
            return response()->json(['message' => 'No tienes un perfil de manager.'], 404);
        }

        return response()->json(['profile' => $this->formatProfile($profile)]);
    }

    /** POST /api/manager/profile — crear o recuperar perfil manager */
    public function createProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->managerProfile) {
            return response()->json(['profile' => $this->formatProfile($user->managerProfile->load('cafe'))]);
        }

        $profile = ManagerProfile::create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Notificar a admins que hay nuevo manager pendiente
        $this->notifyAdmins(
            'Nuevo manager pendiente de aprobación',
            "El usuario @{$user->username} ha solicitado un perfil de manager.",
            ['manager_profile_id' => $profile->id]
        );

        return response()->json(['profile' => $this->formatProfile($profile)], 201);
    }

    /** PUT /api/manager/profile */
    public function updateProfile(Request $request): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'cafe_id' => ['nullable', 'exists:cafes,id'],
        ]);

        // Solo puede vincularse a un café que no tenga ya otro manager
        if (isset($data['cafe_id'])) {
            $taken = ManagerProfile::where('cafe_id', $data['cafe_id'])
                ->where('id', '!=', $profile->id)
                ->exists();

            if ($taken) {
                return response()->json(['message' => 'Este café ya tiene un manager asignado.'], 422);
            }
        }

        $profile->update($data);

        return response()->json(['profile' => $this->formatProfile($profile->fresh('cafe'))]);
    }

    // ─── Creators ───────────────────────────────────────────────────────────

    /** GET /api/manager/creators */
    public function listCreators(Request $request): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $creators = $profile->creators()
            ->with('creator:id,name,username,email,phone')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['creators' => $creators]);
    }

    /** POST /api/manager/creators */
    public function createCreator(Request $request): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        if (! $profile->canAddCreator()) {
            $limit = SiteSettings::first()?->max_creators_per_manager ?? 20;

            return response()->json(['message' => "Límite de {$limit} creadores alcanzado."], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:30', 'unique:users,username', 'alpha_dash', 'lowercase'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email'],
            'gender' => ['required', Rule::in(['hombre', 'mujer', 'trans', 'otro'])],
            'birth_date' => ['required', 'date', 'before_or_equal:'.now()->subYears(18)->toDateString()],
            // Consent digital del creador
            'legal_accepted' => ['required', 'accepted'],
        ], [
            'birth_date.before_or_equal' => 'El creador debe ser mayor de 18 años.',
            'legal_accepted.required' => 'El creador debe aceptar los términos legales.',
            'legal_accepted.accepted' => 'El creador debe aceptar los términos legales.',
        ]);

        return DB::transaction(function () use ($data, $profile) {
            // Generar magic-link token para primer login
            $token = Str::random(48);
            $password = Str::random(32); // temporal, se cambia en primer login

            $creator = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'] ?? null,
                'password' => Hash::make($password),
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'],
                'birth_date' => $data['birth_date'],
                'privacy_consent' => true,
                'privacy_consent_at' => now(),
                'magic_link_token' => hash('sha256', $token),
                'magic_link_expires_at' => now()->addHours(72),
                // Email verificado si no tiene email propio (lo gestiona el manager)
                'email_verified_at' => ! empty($data['email']) ? null : now(),
            ]);

            $creator->assignRole('user'); // pendiente de aprobación → rol user hasta que admin apruebe

            $managerCreator = ManagerCreator::create([
                'manager_profile_id' => $profile->id,
                'creator_user_id' => $creator->id,
                'contact_email' => $data['contact_email'] ?? ($data['email'] ?? null),
                'status' => ManagerCreator::STATUS_PENDING,
            ]);

            // Crear registro de documento (vacío, manager debe subir archivos después)
            $document = CreatorDocument::create([
                'creator_user_id' => $creator->id,
                'manager_profile_id' => $profile->id,
                'type' => 'id_card',
            ]);

            // Notificar admins que hay creador pendiente de revisión
            $this->notifyAdmins(
                'Nuevo creador pendiente de aprobación',
                "El manager @{$profile->user->username} ha creado el perfil @{$creator->username}. Requiere revisión de documentos.",
                ['manager_creator_id' => $managerCreator->id, 'creator_id' => $creator->id]
            );

            $magicLoginUrl = url("/login/magic/{$token}");

            return response()->json([
                'creator' => $creator->only('id', 'name', 'username', 'email', 'phone'),
                'manager_creator' => $managerCreator,
                'document_id' => $document->id,
                'magic_login_url' => $magicLoginUrl,
            ], 201);
        });
    }

    /** PUT /api/manager/creators/{id} — editar perfil completo del creador */
    public function updateCreator(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);
        $creator = $managerCreator->creator;

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'min:3', 'max:30', 'alpha_dash', 'lowercase', Rule::unique('users', 'username')->ignore($creator->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'gender' => ['sometimes', Rule::in(['hombre', 'mujer', 'trans', 'otro'])],
            'price_from' => ['nullable', 'numeric', 'min:0'],
            'card_bg_color' => ['nullable', 'string', 'max:20'],
            'card_bg_opacity' => ['nullable', 'numeric', 'between:0,1'],
            'email_notifications' => ['sometimes', 'boolean'],
            'phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ]);

        $creator->fill($data)->save();

        if (isset($data['contact_email'])) {
            $managerCreator->update(['contact_email' => $data['contact_email']]);
        }

        if (isset($data['tags'])) {
            $creator->tags()->sync($data['tags']);
        }

        return response()->json(['creator' => $creator->fresh(['tags'])]);
    }

    /** DELETE /api/manager/creators/{id} */
    public function deleteCreator(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);

        // Soft-delete: marcar como inactivo, no borrar el user real
        $managerCreator->update(['status' => ManagerCreator::STATUS_INACTIVE]);

        // Quitar rol creator si lo tenía
        $managerCreator->creator->removeRole('creator');
        $managerCreator->creator->assignRole('user');

        return response()->json(['message' => 'Perfil dado de baja correctamente.']);
    }

    // ─── Creator avatar & tags ───────────────────────────────────────────────

    /** PUT /api/manager/creators/{id}/avatar — avatar gestionado por el manager */
    public function updateCreatorAvatar(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);
        $creator = $managerCreator->creator;

        $request->validate(['avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120']]);
        $uploaded = $request->file('avatar');
        $this->assertSafeFile($uploaded);

        $creator->clearMediaCollection('avatar');
        $extension = match ($uploaded->guessExtension()) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $safeName = 'avatar_'.$creator->id.'_'.Str::random(16).'.'.$extension;

        $creator->addMediaFromRequest('avatar')
            ->usingFileName($safeName)
            ->toMediaCollection('avatar');

        return response()->json(['avatar_url' => $creator->getFirstMediaUrl('avatar', 'thumb')]);
    }

    /** POST /api/manager/creators/{id}/tags */
    public function syncCreatorTags(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);

        $data = $request->validate([
            'tags' => ['required', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ]);

        $managerCreator->creator->tags()->sync($data['tags']);

        return response()->json(['tags' => $managerCreator->creator->tags]);
    }

    // ─── Tags ────────────────────────────────────────────────────────────────

    /** POST /api/manager/tags — crear nuevo tag (si SiteSettings lo permite) */
    public function createTag(Request $request): JsonResponse
    {
        $this->requireActiveProfile($request);

        $settings = SiteSettings::first();
        if (! ($settings?->manager_can_create_tags ?? false)) {
            return response()->json(['message' => 'No tienes permiso para crear tags.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:tags,name'],
            'name_en' => ['nullable', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        $tag = Tag::create($data);

        return response()->json(['tag' => $tag], 201);
    }

    // ─── Notificaciones ──────────────────────────────────────────────────────

    /** POST /api/manager/creators/{id}/notify */
    public function notifyCreator(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'url' => ['nullable', 'url', 'max:500'],
        ]);

        Notification::create([
            'user_id' => $managerCreator->creator_user_id,
            'type' => Notification::TYPE_MANAGER_MESSAGE,
            'title' => $data['title'],
            'message' => $data['message'],
            'url' => $data['url'] ?? null,
            'data' => ['manager_profile_id' => $profile->id],
        ]);

        return response()->json(['message' => 'Notificación enviada.']);
    }

    // ─── Documentos ──────────────────────────────────────────────────────────

    /** POST /api/manager/creators/{id}/documents/{docId}/upload */
    public function uploadDocument(Request $request, int $id, int $docId): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);

        $document = CreatorDocument::where('id', $docId)
            ->where('manager_profile_id', $profile->id)
            ->where('creator_user_id', $managerCreator->creator_user_id)
            ->firstOrFail();

        $data = $request->validate([
            'collection' => ['required', Rule::in(['id_front', 'id_back', 'selfie_with_id'])],
            'file' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:8192'],
        ]);

        $uploaded = $request->file('file');
        $this->assertSafeFile($uploaded);

        $extension = match ($uploaded->guessExtension()) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $safeName = 'doc_'.$data['collection'].'_'.$managerCreator->creator_user_id.'_'.Str::random(24).'.'.$extension;

        $document->addMediaFromRequest('file')
            ->usingFileName($safeName)
            ->toMediaCollection($data['collection']);

        // SEC-02: Si se actualizan documentos tras aprobación previa, revertir estado a pendiente y revocar verificación
        if ($managerCreator->isApproved() || $document->verified) {
            $document->update([
                'verified' => false,
                'verified_at' => null,
                'verified_by' => null,
            ]);
            $managerCreator->update(['status' => ManagerCreator::STATUS_PENDING]);
            $this->notifyAdmins(
                'Documentación actualizada para re-verificación',
                "El manager @{$profile->user->username} actualizó documentos del creador @{$managerCreator->creator->username}. Requiere re-validación.",
                ['manager_creator_id' => $managerCreator->id, 'creator_id' => $managerCreator->creator_user_id]
            );
        }

        $media = $document->getFirstMedia($data['collection']);

        return response()->json([
            'collection' => $data['collection'],
            'url' => $media ? route('creator.document.media', $media->id) : null,
            'complete' => $document->fresh()->isComplete(),
        ]);
    }

    // ─── Café ────────────────────────────────────────────────────────────────

    /** GET /api/manager/cafe */
    public function getCafe(Request $request): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        if (! $profile->isCafe()) {
            return response()->json(['message' => 'No tienes un café vinculado.'], 404);
        }

        return response()->json(['cafe' => $profile->cafe->load('branches')]);
    }

    /** PUT /api/manager/cafe */
    public function updateCafe(Request $request): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        if (! $profile->isCafe()) {
            return response()->json(['message' => 'No tienes un café vinculado.'], 404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'website' => ['nullable', 'url', 'max:500'],
        ]);

        $profile->cafe->update($data);

        return response()->json(['cafe' => $profile->cafe->fresh()]);
    }

    /** POST /api/manager/cafe/creators/{userId} — añadir creador a café */
    public function addCreatorToCafe(Request $request, int $userId): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        if (! $profile->isCafe()) {
            return response()->json(['message' => 'No tienes un café vinculado.'], 404);
        }

        // Verificar que el userId es un creador a cargo del manager
        $managerCreator = $profile->creators()
            ->where('creator_user_id', $userId)
            ->where('status', ManagerCreator::STATUS_APPROVED)
            ->firstOrFail();

        // Añadir a la primera branch del café (o requerir branch_id)
        $branch = $profile->cafe->branches()->firstOrFail();
        $branch->creators()->syncWithoutDetaching([$userId]);

        return response()->json(['message' => 'Creador añadido al café.']);
    }

    /** DELETE /api/manager/cafe/creators/{userId} */
    public function removeCreatorFromCafe(Request $request, int $userId): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);

        if (! $profile->isCafe()) {
            return response()->json(['message' => 'No tienes un café vinculado.'], 404);
        }

        foreach ($profile->cafe->branches as $branch) {
            $branch->creators()->detach($userId);
        }

        return response()->json(['message' => 'Creador quitado del café.']);
    }

    // ─── Magic Link login ────────────────────────────────────────────────────

    /** GET /api/manager/creators/{id}/magic-link — regenerar link de acceso */
    public function regenerateMagicLink(Request $request, int $id): JsonResponse
    {
        $profile = $this->requireActiveProfile($request);
        $managerCreator = $this->requireOwnedCreator($profile, $id);
        $creator = $managerCreator->creator;

        // SEC-04: No permitir regenerar magic link si el creador ya completó el acceso inicial y está aprobado
        if ($managerCreator->isApproved()) {
            return response()->json(['message' => 'El creador ya fue aprobado y cuenta con acceso regular. Debe utilizar el flujo de restablecimiento de contraseña.'], 422);
        }

        $token = Str::random(48);
        $creator->update([
            'magic_link_token' => hash('sha256', $token),
            'magic_link_expires_at' => now()->addHours(72),
        ]);

        return response()->json(['magic_login_url' => url("/login/magic/{$token}")]);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    private function requireActiveProfile(Request $request): ManagerProfile
    {
        $profile = $request->user()->managerProfile;

        abort_unless($profile && $profile->isActive(), 403, 'Perfil de manager no activo.');

        return $profile;
    }

    private function requireOwnedCreator(ManagerProfile $profile, int $managerCreatorId): ManagerCreator
    {
        return $profile->creators()->findOrFail($managerCreatorId);
    }

    private function notifyAdmins(string $title, string $message, array $data = []): void
    {
        try {
            $admins = User::role(['admin', 'super_admin'])->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => Notification::TYPE_SYSTEM,
                    'title' => $title,
                    'message' => $message,
                    'data' => $data,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Error notifying admins: '.$e->getMessage());
        }
    }

    private function formatProfile(ManagerProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'status' => $profile->status,
            'notes' => $profile->notes,
            'cafe' => $profile->cafe?->only('id', 'name', 'slug'),
            'creator_count' => $profile->creators()->count(),
            'active_creators' => $profile->activeCreators()->count(),
        ];
    }

    /**
     * Inspección de seguridad: valida estructura binaria y ausencia de código ejecutable/polyglots
     */
    protected function assertSafeFile(UploadedFile $file): void
    {
        $path = $file->getRealPath();
        if (! $path || ! file_exists($path)) {
            abort(422, 'Archivo no válido.');
        }

        // 1. Validar que sea una imagen reconocible por GD/exif
        $imageInfo = @getimagesize($path);
        if (! $imageInfo || ! in_array($imageInfo[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            abort(422, 'Estructura o formato binario de imagen no válido.');
        }

        // 2. Escanear contenido en busca de código ejecutable (PHP, scripts, SVG embebido)
        $contents = @file_get_contents($path);
        if ($contents !== false) {
            if (preg_match('/<\?php|<\?=|__halt_compiler|<script|<svg|<html|<!doctype/i', $contents)) {
                abort(422, 'El archivo contiene secuencias de código no permitidas.');
            }
        }
    }
}
