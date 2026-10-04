<?php

namespace App\Listeners;

use App\Events\CreatorRejected;
use App\Mail\CreatorRejectedMail;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotifyManagerCreatorRejected
{
    public function handle(CreatorRejected $event): void
    {
        $mc = $event->managerCreator->load(['manager.user', 'creator']);
        $manager = $mc->manager->user;
        $creator = $mc->creator;

        Notification::create([
            'user_id' => $manager->id,
            'type' => Notification::TYPE_CREATOR_REJECTED,
            'title' => 'Creador rechazado',
            'message' => "El perfil de @{$creator->username} fue rechazado. Motivo: {$event->reason}",
            'data' => [
                'creator_id' => $creator->id,
                'manager_creator_id' => $mc->id,
                'reason' => $event->reason,
            ],
        ]);

        if ($manager->email && ($manager->email_notifications ?? true)) {
            try {
                Mail::to($manager->email)->send(new CreatorRejectedMail($manager, $creator, $event->reason));
            } catch (\Throwable $e) {
                Log::warning("CreatorRejectedMail failed for manager {$manager->id}: {$e->getMessage()}");
            }
        }
    }
}
