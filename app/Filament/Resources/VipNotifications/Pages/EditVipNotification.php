<?php

namespace App\Filament\Resources\VipNotifications\Pages;

use App\Filament\Resources\VipNotifications\VipNotificationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditVipNotification extends EditRecord
{
    protected static string $resource = VipNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
