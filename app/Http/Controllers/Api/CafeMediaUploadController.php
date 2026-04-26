<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Models\CafeBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CafeMediaUploadController extends Controller
{
    /**
     * Upload temporal de imagen para café
     */
    public function uploadCafeImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
            'cafe_id' => 'nullable|exists:cafes,id',
        ]);

        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $cafe = null;

        // Si se proporciona cafe_id, verificar permisos
        if ($request->has('cafe_id')) {
            $cafe = Cafe::find($request->cafe_id);
            if (! $cafe) {
                return response()->json(['error' => 'Café no encontrado'], 404);
            }

            // Verificar que el usuario sea creador de alguna sucursal del café o admin
            $isCreator = $cafe->branches()
                ->whereHas('creators', function ($query) use ($user): void {
                    $query->where('users.id', $user->id);
                })
                ->exists();
            if (! $isCreator && ! $user->hasRole(['admin', 'super_admin'])) {
                return response()->json(['error' => 'No autorizado para este café'], 403);
            }
        }

        // Guardar en colección temporal con nombre único
        $media = $user->addMedia($request->file('file'))
            ->sanitizingFileName(function ($fileName) {
                return strtolower(str_replace(['#', '/', '\\', ' '], '-', $fileName));
            })
            ->usingFileName('cafe-image-'.uniqid().'.jpg')
            ->toMediaCollection('cafe_image_temp');

        // Retornar el media_id
        return response()->json([
            'media_id' => $media->id,
            'url' => $media->getUrl(),
        ]);
    }

    /**
     * Upload temporal de imagen para sucursal
     */
    public function uploadBranchImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
            'branch_id' => 'nullable|exists:cafe_branches,id',
        ]);

        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $branch = null;

        // Si se proporciona branch_id, verificar permisos
        if ($request->has('branch_id')) {
            $branch = CafeBranch::find($request->branch_id);
            if (! $branch) {
                return response()->json(['error' => 'Sucursal no encontrada'], 404);
            }

            // Verificar que el usuario es creador de la sucursal o admin
            $isCreator = $branch->creators()->where('users.id', $user->id)->exists();
            if (! $isCreator && ! $user->hasRole(['admin', 'super_admin'])) {
                return response()->json(['error' => 'No autorizado para esta sucursal'], 403);
            }
        }

        // Guardar en colección temporal con nombre único
        $media = $user->addMedia($request->file('file'))
            ->sanitizingFileName(function ($fileName) {
                return strtolower(str_replace(['#', '/', '\\', ' '], '-', $fileName));
            })
            ->usingFileName('branch-image-'.uniqid().'.jpg')
            ->toMediaCollection('branch_image_temp');

        // Retornar el media_id
        return response()->json([
            'media_id' => $media->id,
            'url' => $media->getUrl(),
        ]);
    }

    /**
     * Revert/eliminar upload temporal
     */
    public function revert(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $mediaId = $request->getContent();

        if (! $mediaId) {
            return response()->json(['error' => 'Media ID no proporcionado'], 400);
        }

        $media = Media::find($mediaId);

        if ($media && $media->model_id === $user->id && in_array($media->collection_name, ['cafe_image_temp', 'branch_image_temp'])) {
            $media->delete();

            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Media no encontrado o no pertenece a tu cuenta'], 404);
    }
}
