<?php

namespace App\Filament\Resources\ManagerProfiles\Pages;

use App\Filament\Resources\ManagerProfiles\ManagerCreatorResource;
use Filament\Resources\Pages\ListRecords;

class ListManagerCreators extends ListRecords
{
    protected static string $resource = ManagerCreatorResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
