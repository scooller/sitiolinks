<?php

namespace App\Filament\Resources\ManagerProfiles\Pages;

use App\Filament\Resources\ManagerProfiles\ManagerProfileResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditManagerProfile extends EditRecord
{
    protected static string $resource = ManagerProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
