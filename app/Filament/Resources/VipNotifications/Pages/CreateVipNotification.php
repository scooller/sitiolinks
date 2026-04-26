<?php

namespace App\Filament\Resources\VipNotifications\Pages;

use App\Filament\Resources\VipNotifications\VipNotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use Filament\Resources\Pages\CreateRecord;

class CreateVipNotification extends CreateRecord
{
    protected static string $resource = VipNotificationResource::class;

    protected function handleRecordCreation(array $data): Notification
    {
        $recipientId = (int) ($data['recipient_id'] ?? 0);
        $sender = auth('web')->user();

        return NotificationService::create(
            user: $recipientId,
            type: Notification::TYPE_VIP_USER_MESSAGE,
            title: (string) $data['title'],
            message: (string) $data['message'],
            data: [
                'sender_id' => $sender?->id,
                'sender_username' => $sender?->username,
                'sender_name' => $sender?->name,
                'channel' => 'vip',
                'source' => 'filament',
            ],
            url: ! empty($data['url']) ? (string) $data['url'] : null,
        );
    }
}
