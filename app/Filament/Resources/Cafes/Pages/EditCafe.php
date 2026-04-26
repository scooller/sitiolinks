<?php

namespace App\Filament\Resources\Cafes\Pages;

use App\Filament\Resources\Cafes\CafeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCafe extends EditRecord
{
    protected static string $resource = CafeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
