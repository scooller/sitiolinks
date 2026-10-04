<?php

namespace App\Filament\Manager\Resources\Creators\Pages;

use App\Filament\Manager\Resources\Creators\CreatorResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCreators extends ListRecords
{
    protected static string $resource = CreatorResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Registrar Creador'),
        ];
    }
}
