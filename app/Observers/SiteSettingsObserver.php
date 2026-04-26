<?php

namespace App\Observers;

use App\Models\SiteSettings;
use Illuminate\Support\Facades\Cache;

class SiteSettingsObserver
{
    /**
     * Handle the SiteSettings "created" event.
     */
    public function created(SiteSettings $siteSettings): void
    {
        Cache::forget('site_settings');
    }

    /**
     * Handle the SiteSettings "updated" event.
     */
    public function updated(SiteSettings $siteSettings): void
    {
        Cache::forget('site_settings');
    }

    /**
     * Handle the SiteSettings "deleted" event.
     */
    public function deleted(SiteSettings $siteSettings): void
    {
        Cache::forget('site_settings');
    }

    /**
     * Handle the SiteSettings "restored" event.
     */
    public function restored(SiteSettings $siteSettings): void
    {
        Cache::forget('site_settings');
    }

    /**
     * Handle the SiteSettings "force deleted" event.
     */
    public function forceDeleted(SiteSettings $siteSettings): void
    {
        Cache::forget('site_settings');
    }
}
