<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Notification;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class VipNotificationsQuery extends Query
{
    protected $attributes = [
        'name' => 'vipNotifications',
        'description' => 'Lista de notificaciones VIP del usuario autenticado',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Notification'));
    }

    public function args(): array
    {
        return [
            'limit' => [
                'type' => Type::int(),
                'description' => 'Limite de notificaciones a retornar',
                'defaultValue' => 20,
            ],
            'unread_only' => [
                'type' => Type::boolean(),
                'description' => 'Retornar solo no leidas',
                'defaultValue' => false,
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->vipUserMessages()
            ->orderBy('created_at', 'desc');

        if ($args['unread_only']) {
            $query->whereNull('read_at');
        }

        return $query->limit($args['limit'])->get();
    }
}
