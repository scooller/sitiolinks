<?php

namespace App\Filament\Manager\Resources\Tags\Pages;

use App\Filament\Manager\Resources\Tags\ManagerTagResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTag extends CreateRecord
{
    protected static string $resource = ManagerTagResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
