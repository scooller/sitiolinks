<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;

class Media extends BaseMedia
{
    /**
     * Relación con galerías a través de la tabla pivot gallery_media
     */
    public function galleries(): BelongsToMany
    {
        return $this->belongsToMany(
            Gallery::class,
            'gallery_media',
            'media_id',
            'gallery_id'
        )
            ->withPivot(['order', 'caption'])
            ->withTimestamps();
    }
}
