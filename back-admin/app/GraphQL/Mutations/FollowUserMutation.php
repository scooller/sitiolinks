<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use App\Services\NotificationService;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class FollowUserMutation extends Mutation
{
    protected $attributes = [
        'name' => 'followUser',
        'description' => 'Seguir a un usuario',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del usuario a seguir',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $currentUser = auth('web')->user();

        if (! $currentUser) {
            throw new \Exception('Debes estar autenticado para seguir a un usuario.');
        }

        $userToFollow = User::findOrFail($args['user_id']);

        if ($currentUser->id === $userToFollow->id) {
            throw new \Exception('No puedes seguirte a ti mismo.');
        }

        // Solo se puede seguir a usuarios con rol creator
        if (! $userToFollow->hasRole('creator')) {
            throw new \Exception('Solo puedes seguir a usuarios con rol de creador.');
        }

        $currentUser->follow($userToFollow);

        // Notificar al usuario seguido
        NotificationService::notifyNewFollower($userToFollow, $currentUser);

        return $userToFollow->fresh();
    }
}
