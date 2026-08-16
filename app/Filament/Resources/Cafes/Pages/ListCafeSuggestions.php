<?php

namespace App\Filament\Resources\Cafes\Pages;

use App\Filament\Resources\Cafes\CafeSuggestionResource;
use Filament\Resources\Pages\ListRecords;

class ListCafeSuggestions extends ListRecords
{
    protected static string $resource = CafeSuggestionResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
