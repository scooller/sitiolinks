<?php

namespace App\Observers;

use App\Support\WatermarkManipulator;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaObserver
{
    public function created(Media $media)
    {
        // Aplicar watermark solo a imágenes
        if (! str_starts_with($media->mime_type, 'image/')) {
            return;
        }

        // Aplicar watermark al archivo original
        $originalPath = $media->getPath();
        if (file_exists($originalPath)) {
            WatermarkManipulator::apply($originalPath);
        }
    }

    public function updated(Media $media)
    {
        // Aplicar watermark si se actualiza una imagen
        if (! str_starts_with($media->mime_type, 'image/')) {
            return;
        }

        $originalPath = $media->getPath();
        if (file_exists($originalPath)) {
            WatermarkManipulator::apply($originalPath);
        }
    }
}
