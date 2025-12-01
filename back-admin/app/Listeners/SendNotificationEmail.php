<?php

namespace App\Listeners;

use App\Events\NotificationCreated;
use App\Mail\NotificationEmail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendNotificationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationCreated $event): void
    {
        $notification = $event->notification;
        $user = $notification->user;

        // Solo enviar email si el usuario tiene habilitadas las notificaciones por email
        if (! $user || ! $user->email_notifications) {
            return;
        }

        // Verificar que el usuario tenga email
        if (! $user->email) {
            return;
        }

        // Enviar el email
        Mail::to($user->email)->send(new NotificationEmail($notification, $user));
    }
}
