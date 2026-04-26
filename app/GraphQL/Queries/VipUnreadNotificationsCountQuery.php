<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Services\NotificationService;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;

class VipUnreadNotificationsCountQuery extends Query
{
    protected $attributes = [
        'name' => 'vipUnreadNotificationsCount',
        'description' => 'Contador de notificaciones VIP no leidas del usuario autenticado',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::int());
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            return 0;
        }

        return NotificationService::getVipUnreadCount($user);
    }
}
