<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class GalleryMediaController extends Controller
{
    /**
     * Upload media to the authenticated user's 'gallery' collection
     */
    public function upload(Request $request): JsonResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        // Determinar límite de tamaño según rol (en MB)
        $roleNames = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', get_class($user))
            ->where('model_has_roles.model_id', $user->id)
            ->pluck('roles.name')
            ->toArray();

        $settings = SiteSettings::first();
        $maxMb = null; // null = ilimitado
        $isAdmin = in_array('admin', $roleNames, true) || in_array('super_admin', $roleNames, true);

        if (! $isAdmin) {
            if (in_array('vip', $roleNames, true)) {
                $maxMb = $settings?->max_upload_size_vip ?? 20; // fallback 20MB
            } elseif (in_array('creator', $roleNames, true)) {
                $maxMb = $settings?->max_upload_size_creator ?? 5; // fallback 5MB
            }
        }

        // Construir regla dinámica de tamaño (Laravel usa KB para max en archivos)
        $sizeRule = $maxMb !== null ? '|max:'.($maxMb * 1024) : ''; // si ilimitado no se agrega max

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpeg,png,gif,webp'.$sizeRule,
            'caption' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            // Ajustar mensaje si es por tamaño excedido
            $errorMsg = $validator->errors()->first();
            if (str_contains($errorMsg, 'kilobytes')) {
                // Estandarizar mensaje para el frontend
                if ($maxMb !== null) {
                    $errorMsg = "El archivo excede el tamaño máximo permitido de {$maxMb}MB para tu rol.";
                } else {
                    $errorMsg = 'El archivo excede el tamaño máximo permitido.';
                }
            }

            return response()->json([
                'error' => $errorMsg,
                'error_code' => 'VALIDATION_ERROR',
            ], 422);
        }

        try {
            // Validación manual adicional por seguridad (en caso de límite ilimitado pero server restrictivo)
            if ($maxMb !== null) {
                $fileSizeMb = $request->file('file')->getSize() / 1024 / 1024; // bytes → MB
                if ($fileSizeMb > ($maxMb + 0.01)) { // pequeño margen
                    return response()->json([
                        'error' => "El archivo excede el tamaño máximo permitido de {$maxMb}MB para tu rol.",
                        'error_code' => 'FILE_TOO_LARGE',
                    ], 422);
                }
            }

            // Validación de límite de medios sin galería (solo para evitar acumulación excesiva de uploads temporales)
            // La validación real por galería se hace en AddMediaToGalleryMutation
            $temporaryMediaCount = $user->getMedia('gallery')
                ->filter(function ($media) {
                    // Contar solo medios NO adjuntos a ninguna galería
                    return ! DB::table('gallery_media')->where('media_id', $media->id)->exists();
                })
                ->count();

            // Permitir máximo 50 uploads temporales pendientes (independiente del límite por galería)
            if ($temporaryMediaCount >= 50) {
                return response()->json([
                    'error' => 'Tienes demasiados archivos temporales sin adjuntar. Por favor adjúntalos a una galería o elimínalos antes de subir más.',
                    'error_code' => 'TOO_MANY_TEMP_FILES',
                ], 422);
            }

            $media = $user->addMedia($request->file('file'))
                ->sanitizingFileName(function ($fileName) {
                    // Remover caracteres especiales y espacios, mantener solo letras, números, guiones y puntos
                    return strtolower(str_replace(['#', '/', '\\', ' '], '-', $fileName));
                })
                ->usingFileName(uniqid().'.jpg') // Generar nombre único
                ->toMediaCollection('gallery');

            return response()->json([
                'success' => true,
                'media_id' => $media->id,
                'url' => $media->getUrl(),
                'thumb_url' => method_exists($media, 'hasGeneratedConversion') && $media->hasGeneratedConversion('thumb')
                    ? $media->getUrl('thumb')
                    : null,
                'max_upload_mb' => $maxMb,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Upload failed: '.$e->getMessage(),
                'error_code' => 'UPLOAD_ERROR',
            ], 500);
        }
    }

    /**
     * Delete (revert) a media that was uploaded but not yet attached to a gallery
     * This is called when FilePond cancels an upload
     */
    public function revert(Request $request): JsonResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Soportar tanto texto plano (FilePond estándar) como JSON (cleanup manual)
        $mediaId = null;

        // Intentar obtener de JSON primero
        if ($request->isJson() && $request->has('media_id')) {
            $mediaId = $request->input('media_id');
        } else {
            // FilePond envía el serverId como texto plano
            $mediaId = $request->getContent();
        }

        if (! $mediaId || ! is_numeric($mediaId)) {
            return response()->json(['error' => 'Invalid media ID'], 422);
        }

        try {
            $media = Media::find((int) $mediaId);

            // Verificar que el medio existe, pertenece al usuario y está en la colección 'gallery'
            if (! $media || $media->model_id !== $user->id || $media->collection_name !== 'gallery') {
                return response()->json(['error' => 'Media not found or unauthorized'], 404);
            }

            // Verificar que NO esté adjunto a ninguna galería (consulta directa a la tabla pivot)
            $isAttached = DB::table('gallery_media')->where('media_id', $media->id)->exists();
            if ($isAttached) {
                return response()->json(['error' => 'Media is already attached to a gallery'], 422);
            }

            // Eliminar el medio
            $media->delete();

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Delete failed: '.$e->getMessage(),
            ], 500);
        }
    }
}
