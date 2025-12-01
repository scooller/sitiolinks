<?php

namespace App\Observers;

use App\Models\Tag;
use Illuminate\Support\Facades\Cache;

class TagObserver
{
    /**
     * Handle the Tag "created" event.
     */
    public function created(Tag $tag): void
    {
        $this->clearTagsCache();
    }

    /**
     * Handle the Tag "updated" event.
     */
    public function updated(Tag $tag): void
    {
        $this->clearTagsCache();
    }

    /**
     * Handle the Tag "deleted" event.
     */
    public function deleted(Tag $tag): void
    {
        $this->clearTagsCache();
    }

    /**
     * Handle the Tag "restored" event.
     */
    public function restored(Tag $tag): void
    {
        $this->clearTagsCache();
    }

    /**
     * Handle the Tag "force deleted" event.
     */
    public function forceDeleted(Tag $tag): void
    {
        $this->clearTagsCache();
    }

    /**
     * Clear all tags cache keys
     */
    protected function clearTagsCache(): void
    {
        Cache::forget('tags_all');
        Cache::forget('tags_selectable');
    }
}
