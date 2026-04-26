<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CafeBranch extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $table = 'cafe_branches';

    protected $fillable = [
        'cafe_id',
        'name',
        'description',
        'address',
        'city',
        'state',
        'postal_code',
        'phone',
        'website',
        'google_maps_url',
        'menu_qr_url',
        'entry_price',
    ];

    protected $casts = [
        'entry_price' => 'decimal:2',
    ];

    /**
     * Get the cafe that owns this branch.
     */
    public function cafe(): BelongsTo
    {
        return $this->belongsTo(Cafe::class);
    }

    /**
     * Get all reviews for this branch.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(CafeBranchReview::class);
    }

    /**
     * Get all tags associated with this branch.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'cafe_branch_tag')->withTimestamps();
    }

    /**
     * Get all creators associated with this branch.
     */
    public function creators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'cafe_branch_creator')->withTimestamps();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('branch_image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('branch_image_temp')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media && $media->collection_name === 'branch_image') {
            // Thumbnail - tamaño pequeño
            $this->addMediaConversion('thumb')
                ->width(200)
                ->height(120)
                ->keepOriginalImageFormat()
                ->performOnCollections('branch_image')
                ->nonQueued();

            // Thumbnail WebP para navegadores modernos
            $this->addMediaConversion('thumb_webp')
                ->width(200)
                ->height(120)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('branch_image')
                ->nonQueued();

            // Preview - tamaño medio
            $this->addMediaConversion('preview')
                ->width(600)
                ->height(360)
                ->keepOriginalImageFormat()
                ->performOnCollections('branch_image')
                ->nonQueued();
        }
    }
}
