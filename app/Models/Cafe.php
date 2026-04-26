<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Cafe extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'website',
    ];

    protected static function booted(): void
    {
        static::creating(function (Cafe $cafe): void {
            if (! $cafe->slug) {
                $cafe->slug = static::generateUniqueSlug($cafe->name);
            }
        });

        static::updating(function (Cafe $cafe): void {
            if ($cafe->isDirty('name') && ! $cafe->isDirty('slug')) {
                $cafe->slug = static::generateUniqueSlug($cafe->name, $cafe->id);
            }
        });
    }

    protected static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'cafe';
        $slug = $baseSlug;
        $suffix = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

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
