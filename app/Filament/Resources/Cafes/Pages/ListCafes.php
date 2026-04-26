<?php

namespace App\Filament\Resources\Cafes\Pages;

use App\Filament\Resources\Cafes\CafeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCafes extends ListRecords
{
    protected static string $resource = CafeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
