<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AvatarUploadController extends Controller
{
    /**
     * Upload temporal de avatar (usado por FilePond)
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
        ]);

        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        // Guardar en colección temporal 'avatar_temp' con nombre único
        $media = $user->addMedia($request->file('file'))
            ->sanitizingFileName(function ($fileName) {
                return strtolower(str_replace(['#', '/', '\\', ' '], '-', $fileName));
            })
            ->usingFileName('avatar-'.$user->id.'-'.uniqid().'.jpg')
            ->toMediaCollection('avatar_temp');

        // Retornar el media_id para que FilePond lo use como serverId
        return response()->json([
            'media_id' => $media->id,
            'url' => $media->getUrl(),
            'thumb_url' => $media->getUrl('thumb'),
        ]);
    }

    /**
     * Revert/eliminar upload temporal (cuando FilePond cancela)
     */
    public function revert(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        // El serverId viene como texto en el body
        $mediaId = $request->getContent();

        if (! $mediaId) {
            return response()->json(['error' => 'Media ID no proporcionado'], 400);
        }

        $media = Media::find($mediaId);

        if ($media && $media->model_id === $user->id && $media->collection_name === 'avatar_temp') {
            $media->delete();

            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Media no encontrado o no pertenece a tu cuenta'], 404);
    }
}
