<?php

namespace App\Filament\Resources\SiteSettings\Pages;

use App\Filament\Resources\SiteSettings\SiteSettingsResource;
use App\Models\SiteSettings;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Cache;

class EditSiteSettings extends EditRecord
{
    protected static string $resource = SiteSettingsResource::class;

    public function mount(int|string|null $record = null): void
    {
        // Always load the first (and only) settings record
        $settings = SiteSettings::firstOrFail();
        parent::mount($settings->id);
    }

    protected function getHeaderActions(): array
    {
        return [
            // No delete action for singleton settings
        ];
    }

    protected function afterSave(): void
    {
        Cache::forget('site_settings');
    }
}
