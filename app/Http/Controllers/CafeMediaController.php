<?php

namespace App\Http\Controllers;

use App\Models\Cafe;
use App\Models\CafeBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CafeMediaController extends Controller
{
    /**
     * Serve cafe image from storage (Filament uploads)
     */
    public function serveFilamentCafeImage(Request $request, $path)
    {
        $fullPath = 'public/cafes/'.$path;

        if (! Storage::disk('local')->exists($fullPath)) {
            abort(404, 'File not found');
        }

        return response()->file(Storage::disk('local')->path($fullPath), [
            'Content-Type' => Storage::disk('local')->mimeType($fullPath),
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Serve branch image from storage (Filament uploads)
     */
    public function serveFilamentBranchImage(Request $request, $path)
    {
        $fullPath = 'public/cafe-branches/'.$path;

        if (! Storage::disk('local')->exists($fullPath)) {
            abort(404, 'File not found');
        }

        return response()->file(Storage::disk('local')->path($fullPath), [
            'Content-Type' => Storage::disk('local')->mimeType($fullPath),
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Serve cafe image from Media Library (API uploads)
     */
    public function serveCafeMedia(Request $request, $cafeId, $media)
    {
        $cafe = Cafe::findOrFail($cafeId);
        $media = Media::findOrFail($media);

        // Verify the media belongs to this cafe's collection
        if ($media->model_id !== $cafe->id || $media->model_type !== Cafe::class || $media->collection_name !== 'cafe_image') {
            abort(404, 'Media not found');
        }

        // Serve the file
        $path = $media->getPath();

        if (! file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->file($path, [
            'Content-Type' => $media->mime_type,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Serve branch image from Media Library (API uploads)
     */
    public function serveBranchMedia(Request $request, $branchId, $media)
    {
        $branch = CafeBranch::findOrFail($branchId);
        $media = Media::findOrFail($media);

        // Verify the media belongs to this branch's collection
        if ($media->model_id !== $branch->id || $media->model_type !== CafeBranch::class || $media->collection_name !== 'branch_image') {
            abort(404, 'Media not found');
        }

        // Serve the file
        $path = $media->getPath();

        if (! file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->file($path, [
            'Content-Type' => $media->mime_type,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}
