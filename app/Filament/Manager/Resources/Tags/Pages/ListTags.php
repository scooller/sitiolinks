<?php

namespace App\Filament\Manager\Resources\Tags\Pages;

use App\Filament\Manager\Resources\Tags\ManagerTagResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTags extends ListRecords
{
    protected static string $resource = ManagerTagResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->visible(fn () => ManagerTagResource::canCreate()),
        ];
    }
}
