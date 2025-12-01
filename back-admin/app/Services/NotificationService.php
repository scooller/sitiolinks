<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Crear una notificación para un usuario
     */
    public static function create(
        int|User $user,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $url = null
    ): Notification {
        $userId = $user instanceof User ? $user->id : $user;

        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'url' => $url,
        ]);

        // Broadcast en tiempo real
        broadcast(new NotificationCreated($notification))->toOthers();

        return $notification;
    }

    /**
     * Notificar al recibir un follow
     */
    public static function notifyNewFollower(User $followed, User $follower): Notification
    {
        return self::create(
            user: $followed,
            type: Notification::TYPE_FOLLOW,
            title: 'Nuevo seguidor',
            message: "@{$follower->username} ahora te sigue.",
            data: ['follower_id' => $follower->id, 'follower_username' => $follower->username],
            url: "/u/{$follower->username}"
        );
    }

    /**
     * Notificar cuando se aprueba una galería
     */
    public static function notifyGalleryApproved(User $owner, int $galleryId, string $galleryTitle): Notification
    {
        return self::create(
            user: $owner,
            type: Notification::TYPE_GALLERY_APPROVED,
            title: 'Galería aprobada',
            message: "Tu galería \"{$galleryTitle}\" ha sido aprobada.",
            data: ['gallery_id' => $galleryId],
            url: "/u/{$owner->username}/galleries"
        );
    }

    /**
     * Notificar cuando se rechaza una galería
     */
    public static function notifyGalleryRejected(User $owner, int $galleryId, string $galleryTitle): Notification
    {
        return self::create(
            user: $owner,
            type: Notification::TYPE_GALLERY_REJECTED,
            title: 'Galería rechazada',
            message: "Tu galería \"{$galleryTitle}\" no ha sido aprobada. Revisa el contenido.",
            data: ['gallery_id' => $galleryId],
            url: "/u/{$owner->username}/galleries"
        );
    }

    /**
     * Notificar cuando se destaca una galería
     */
    public static function notifyGalleryFeatured(User $owner, int $galleryId, string $galleryTitle): Notification
    {
        return self::create(
            user: $owner,
            type: Notification::TYPE_GALLERY_FEATURED,
            title: '¡Galería destacada!',
            message: "Tu galería \"{$galleryTitle}\" ha sido destacada. ¡Felicitaciones!",
            data: ['gallery_id' => $galleryId],
            url: "/u/{$owner->username}/galleries"
        );
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    public static function markAllAsRead(int|User $user): int
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Obtener contador de no leídas
     */
    public static function getUnreadCount(int|User $user): int
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }
}
