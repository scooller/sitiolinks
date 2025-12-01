<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    /**
     * Serve private gallery media with authorization check
     */
    public function serveGalleryMedia(Request $request, $mediaId)
    {
        $media = Media::findOrFail($mediaId);

        // Find gallery that contains this media
        $gallery = Gallery::whereHas('media', function ($query) use ($mediaId) {
            $query->where('media.id', $mediaId);
        })->first();

        if (! $gallery) {
            abort(404, 'Media not found in any gallery');
        }

        // Check if user has permission to view this gallery
        $user = auth('web')->user();

        if (! $gallery->isVisibleTo($user)) {
            abort(403, 'You do not have permission to view this media');
        }

        // Serve the file
        $path = $media->getPath();

        if (! file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->file($path, [
            'Content-Type' => $media->mime_type,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Serve private gallery media with conversion (thumbnail, preview, etc)
     */
    public function serveGalleryMediaConversion(Request $request, $mediaId, $conversion)
    {
        $media = Media::findOrFail($mediaId);

        // Find gallery that contains this media
        $gallery = Gallery::whereHas('media', function ($query) use ($mediaId) {
            $query->where('media.id', $mediaId);
        })->first();

        if (! $gallery) {
            abort(404, 'Media not found in any gallery');
        }

        // Check if user has permission to view this gallery
        $user = auth('web')->user();

        if (! $gallery->isVisibleTo($user)) {
            abort(403, 'You do not have permission to view this media');
        }

        // Serve the conversion file
        $path = $media->getPath($conversion);

        if (! file_exists($path)) {
            abort(404, 'Conversion not found');
        }

        // Determine correct mime type based on conversion file extension
        $mimeType = $media->mime_type;
        if (str_ends_with($conversion, '_webp') || str_ends_with($path, '.webp')) {
            $mimeType = 'image/webp';
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
