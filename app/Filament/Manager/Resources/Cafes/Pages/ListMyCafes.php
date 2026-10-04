<?php

namespace App\Filament\Manager\Resources\Cafes\Pages;

use App\Filament\Manager\Resources\Cafes\MyCafeResource;
use Filament\Resources\Pages\ListRecords;

class ListMyCafes extends ListRecords
{
    protected static string $resource = MyCafeResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
