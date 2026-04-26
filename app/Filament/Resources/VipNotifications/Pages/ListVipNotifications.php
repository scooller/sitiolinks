<?php

namespace App\Filament\Resources\VipNotifications\Pages;

use App\Filament\Resources\VipNotifications\VipNotificationResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListVipNotifications extends ListRecords
{
    protected static string $resource = VipNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
