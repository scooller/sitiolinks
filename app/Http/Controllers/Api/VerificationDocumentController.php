<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreatorDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VerificationDocumentController extends Controller
{
    /**
     * GET /api/verification-documents/status
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $document = CreatorDocument::where('creator_user_id', $user->id)
            ->whereNull('manager_profile_id')
            ->first();

        if (! $document) {
            return response()->json([
                'has_id_front' => false,
                'has_id_back' => false,
                'has_selfie' => false,
                'is_complete' => false,
                'verified' => false,
                'verified_at' => null,
                'notes' => null,
                'urls' => [
                    'id_front' => null,
                    'id_back' => null,
                    'selfie_with_id' => null,
                ],
            ]);
        }

        $front = $document->getFirstMedia('id_front');
        $back = $document->getFirstMedia('id_back');
        $selfie = $document->getFirstMedia('selfie_with_id');

        return response()->json([
            'has_id_front' => (bool) $front,
            'has_id_back' => (bool) $back,
            'has_selfie' => (bool) $selfie,
            'is_complete' => $document->isComplete(),
            'verified' => (bool) $document->verified,
            'verified_at' => $document->verified_at?->toIso8601String(),
            'notes' => $document->notes,
            'urls' => [
                'id_front' => $front ? route('creator.document.media', $front->id) : null,
                'id_back' => $back ? route('creator.document.media', $back->id) : null,
                'selfie_with_id' => $selfie ? route('creator.document.media', $selfie->id) : null,
            ],
        ]);
    }

    /**
     * POST /api/verification-documents/upload
     */
    public function upload(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $data = $request->validate([
            'collection' => ['required', Rule::in(['id_front', 'id_back', 'selfie_with_id'])],
            'file' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:8192'], // 8MB
        ]);

        $uploaded = $request->file('file');
        $this->assertSafeFile($uploaded);

        $document = CreatorDocument::firstOrCreate(
            ['creator_user_id' => $user->id, 'manager_profile_id' => null],
            ['type' => 'identification', 'verified' => false]
        );

        $extension = match ($uploaded->guessExtension()) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $safeName = 'doc_'.$data['collection'].'_'.$user->id.'_'.Str::random(24).'.'.$extension;

        $document->addMediaFromRequest('file')
            ->usingFileName($safeName)
            ->toMediaCollection($data['collection']);

        // Revocar verificación previa si el usuario cambia el documento
        if ($document->verified) {
            $document->update([
                'verified' => false,
                'verified_at' => null,
                'verified_by' => null,
            ]);
        }

        $fresh = $document->fresh();
        $media = $fresh->getFirstMedia($data['collection']);

        return response()->json([
            'message' => 'Documento subido correctamente.',
            'collection' => $data['collection'],
            'url' => $media ? route('creator.document.media', $media->id) : null,
            'has_id_front' => $fresh->hasMedia('id_front'),
            'has_id_back' => $fresh->hasMedia('id_back'),
            'has_selfie' => $fresh->hasMedia('selfie_with_id'),
            'is_complete' => $fresh->isComplete(),
            'verified' => (bool) $fresh->verified,
        ]);
    }

    /**
     * DELETE /api/verification-documents/{collection}
     */
    public function deleteDocument(Request $request, string $collection): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        if (! in_array($collection, ['id_front', 'id_back', 'selfie_with_id'], true)) {
            return response()->json(['error' => 'Colección inválida'], 422);
        }

        $document = CreatorDocument::where('creator_user_id', $user->id)
            ->whereNull('manager_profile_id')
            ->first();

        if ($document) {
            $document->clearMediaCollection($collection);
            if ($document->verified) {
                $document->update([
                    'verified' => false,
                    'verified_at' => null,
                    'verified_by' => null,
                ]);
            }
        }

        $fresh = $document?->fresh();

        return response()->json([
            'message' => 'Documento eliminado.',
            'collection' => $collection,
            'has_id_front' => $fresh ? $fresh->hasMedia('id_front') : false,
            'has_id_back' => $fresh ? $fresh->hasMedia('id_back') : false,
            'has_selfie' => $fresh ? $fresh->hasMedia('selfie_with_id') : false,
            'is_complete' => $fresh ? $fresh->isComplete() : false,
            'verified' => $fresh ? (bool) $fresh->verified : false,
        ]);
    }

    /**
     * Inspección de seguridad: valida estructura binaria y ausencia de código malicioso/polyglots
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
