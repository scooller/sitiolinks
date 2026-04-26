<?php

use App\Providers\AppServiceProvider;
use App\Providers\Filament\AdminPanelProvider;
use App\Providers\MediaLibraryServiceProvider;

return [
    AppServiceProvider::class,
    AdminPanelProvider::class,
    MediaLibraryServiceProvider::class,
];
