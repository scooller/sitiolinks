<?php

namespace App\Listeners;

use App\Events\CreatorApproved;
use App\Mail\CreatorApprovedMail;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotifyManagerCreatorApproved
{
    public function handle(CreatorApproved $event): void
    {
        $mc = $event->managerCreator->load(['manager.user', 'creator']);
        $manager = $mc->manager->user;
        $creator = $mc->creator;

        // Actualizar rol del creador
        $creator->removeRole('user');
        $creator->assignRole('creator');

        // Notificación in-app al manager
        Notification::create([
            'user_id' => $manager->id,
            'type' => Notification::TYPE_CREATOR_APPROVED,
            'title' => '¡Creador aprobado!',
            'message' => "El perfil de @{$creator->username} ha sido aprobado por el equipo.",
            'data' => [
                'creator_id' => $creator->id,
                'manager_creator_id' => $mc->id,
            ],
        ]);

        // Email al manager (solo si tiene email y notificaciones activas)
        if ($manager->email && ($manager->email_notifications ?? true)) {
            try {
                Mail::to($manager->email)->send(new CreatorApprovedMail($manager, $creator));
            } catch (\Throwable $e) {
                Log::warning("CreatorApprovedMail failed for manager {$manager->id}: {$e->getMessage()}");
            }
        }
    }
}
