<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Services\NotificationService;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;

class MarkAllNotificationsAsReadMutation extends Mutation
{
    protected $attributes = [
        'name' => 'markAllNotificationsAsRead',
        'description' => 'Marcar todas las notificaciones del usuario como leídas',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::int());
    }

    public function resolve($root, array $args)
    {
        $user = auth()->user();

        if (! $user) {
            throw new \Exception('No autenticado');
        }

        return NotificationService::markAllAsRead($user);
    }
}
