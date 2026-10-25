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
        $mc = $event->managerCreator->load(['manager.user', 'creator.managerProfile']);
        $manager = $mc->manager?->user;
        $creator = $mc->creator;

        if ($creator) {
            // Actualizar rol del creador
            $creator->removeRole('user');
            $creator->assignRole('creator');

            // Si solicitó ser manager, activar perfil y rol
            if ($creator->managerProfile) {
                $creator->managerProfile->update(['status' => 'active']);
                if (! $creator->hasRole('manager')) {
                    $creator->assignRole('manager');
                }
            }

            // Notificación in-app al creador
            Notification::create([
                'user_id' => $creator->id,
                'type' => Notification::TYPE_CREATOR_APPROVED,
                'title' => '¡Tu solicitud fue aprobada!',
                'message' => '¡Felicidades! Tu cuenta ha sido habilitada como Creador de Contenido.',
                'data' => [
                    'creator_id' => $creator->id,
                    'manager_creator_id' => $mc->id,
                ],
            ]);
        }

        // Notificación in-app y correo al manager (si aplica)
        if ($manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => Notification::TYPE_CREATOR_APPROVED,
                'title' => '¡Creador aprobado!',
                'message' => "El perfil de @{$creator?->username} ha sido aprobado por el equipo.",
                'data' => [
                    'creator_id' => $creator?->id,
                    'manager_creator_id' => $mc->id,
                ],
            ]);

            if ($manager->email && ($manager->email_notifications ?? true)) {
                try {
                    Mail::to($manager->email)->send(new CreatorApprovedMail($manager, $creator));
                } catch (\Throwable $e) {
                    Log::warning("CreatorApprovedMail failed for manager {$manager->id}: {$e->getMessage()}");
                }
            }
        }
    }
}
