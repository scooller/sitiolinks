<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Notification;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class NotificationsQuery extends Query
{
    protected $attributes = [
        'name' => 'notifications',
        'description' => 'Lista de notificaciones del usuario autenticado',
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
                'description' => 'Límite de notificaciones a retornar',
                'defaultValue' => 20,
            ],
            'unread_only' => [
                'type' => Type::boolean(),
                'description' => 'Retornar solo notificaciones no leídas',
                'defaultValue' => false,
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth()->user();

        if (! $user) {
            throw new \Exception('No autenticado');
        }

        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($args['unread_only']) {
            $query->whereNull('read_at');
        }

        return $query->limit($args['limit'])->get();
    }
}
