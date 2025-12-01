<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UnfollowUserMutation extends Mutation
{
    protected $attributes = [
        'name' => 'unfollowUser',
        'description' => 'Dejar de seguir a un usuario',
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
                'description' => 'ID del usuario a dejar de seguir',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $currentUser = auth('web')->user();

        if (! $currentUser) {
            throw new \Exception('Debes estar autenticado para dejar de seguir a un usuario.');
        }

        $userToUnfollow = User::findOrFail($args['user_id']);

        // Validación adicional: solo se puede dejar de seguir a creadores
        if (! $userToUnfollow->hasRole('creator')) {
            throw new \Exception('Solo puedes dejar de seguir a usuarios con rol de creador.');
        }

        $currentUser->unfollow($userToUnfollow);

        return $userToUnfollow->fresh();
    }
}
