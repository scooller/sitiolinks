<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\NotificationService;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;

class UnreadNotificationsCountQuery extends Query
{
    protected $attributes = [
        'name' => 'unreadNotificationsCount',
        'description' => 'Contador de notificaciones no leídas del usuario autenticado',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::int());
    }

    public function resolve($root, array $args)
    {
        $user = auth()->user();

        if (! $user) {
            return 0;
        }

        return NotificationService::getUnreadCount($user);
    }
}
