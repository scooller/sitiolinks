<?php

namespace App\Observers;

use App\Models\Gallery;
use App\Services\NotificationService;

class GalleryObserver
{
    /**
     * Al actualizar una galería, verificar cambios de estado para notificar
     */
    public function updated(Gallery $gallery): void
    {
        // Invalidar caché de galerías ante cambios significativos
        if ($gallery->isDirty(['status', 'visibility', 'user_id', 'title', 'description', 'is_featured'])) {
            \App\Services\GraphQLCache::flushFor('galleries');
        }
        // Notificar cuando se aprueba
        if ($gallery->isDirty('status') && $gallery->status === 'approved' && $gallery->getOriginal('status') !== 'approved') {
            NotificationService::notifyGalleryApproved(
                owner: $gallery->user,
                galleryId: $gallery->id,
                galleryTitle: $gallery->title
            );
        }

        // Notificar cuando se rechaza
        if ($gallery->isDirty('status') && $gallery->status === 'rejected' && $gallery->getOriginal('status') !== 'rejected') {
            NotificationService::notifyGalleryRejected(
                owner: $gallery->user,
                galleryId: $gallery->id,
                galleryTitle: $gallery->title
            );
        }

        // Notificar cuando se destaca
        if ($gallery->isDirty('is_featured') && $gallery->is_featured && ! $gallery->getOriginal('is_featured')) {
            NotificationService::notifyGalleryFeatured(
                owner: $gallery->user,
                galleryId: $gallery->id,
                galleryTitle: $gallery->title
            );
        }
    }

    public function created(Gallery $gallery): void
    {
        \App\Services\GraphQLCache::flushFor('galleries');
    }

    public function deleted(Gallery $gallery): void
    {
        \App\Services\GraphQLCache::flushFor('galleries');
    }
}
