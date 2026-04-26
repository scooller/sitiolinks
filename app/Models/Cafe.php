<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Cafe extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'name',
        'description',
        'website',
    ];

    /**
     * Get all branches for this cafe.
     */
    public function branches(): HasMany
    {
        return $this->hasMany(CafeBranch::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cafe_image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('cafe_image_temp')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media && $media->collection_name === 'cafe_image') {
            // Thumbnail
            $this->addMediaConversion('thumb')
                ->width(200)
                ->height(120)
                ->keepOriginalImageFormat()
                ->performOnCollections('cafe_image')
                ->nonQueued();

            // Thumbnail WebP
            $this->addMediaConversion('thumb_webp')
                ->width(200)
                ->height(120)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('cafe_image')
                ->nonQueued();

            // Preview
            $this->addMediaConversion('preview')
                ->width(600)
                ->height(360)
                ->keepOriginalImageFormat()
                ->performOnCollections('cafe_image')
                ->nonQueued();
        }
    }
}
