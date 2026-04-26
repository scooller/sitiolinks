<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Notification;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class MarkNotificationAsReadMutation extends Mutation
{
    protected $attributes = [
        'name' => 'markNotificationAsRead',
        'description' => 'Marcar una notificación como leída',
    ];

    public function type(): Type
    {
        return GraphQL::type('Notification');
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID de la notificación',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth()->user();

        if (! $user) {
            throw new \Exception('No autenticado');
        }

        $notification = Notification::where('id', $args['id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->markAsRead();

        return $notification->fresh();
    }
}
