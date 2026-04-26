<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class GalleryMedia extends Pivot
{
    protected $table = 'gallery_media';

    protected $fillable = [
        'gallery_id',
        'media_id',
        'order',
        'caption',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function gallery(): BelongsTo
    {
        return $this->belongsTo(Gallery::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
