<?php

namespace App\Filament\Resources\ManagerProfiles\Pages;

use App\Filament\Resources\ManagerProfiles\ManagerProfileResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListManagerProfiles extends ListRecords
{
    protected static string $resource = ManagerProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
