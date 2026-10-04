<?php

namespace App\Filament\Manager\Resources\Cafes\Pages;

use App\Filament\Manager\Resources\Cafes\MyCafeResource;
use Filament\Resources\Pages\EditRecord;

class EditMyCafe extends EditRecord
{
    protected static string $resource = MyCafeResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
