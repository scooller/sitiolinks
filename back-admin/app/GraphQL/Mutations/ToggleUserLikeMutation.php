<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use App\Models\UserLike;
use Closure;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ToggleUserLikeMutation extends Mutation
{
    protected $attributes = [
        'name' => 'toggleUserLike',
        'description' => 'Da o quita un like a un perfil de usuario. Devuelve el estado actual del like.',
    ];

    public function type(): Type
    {
        return GraphQL::type('UserLike');
    }

    public function args(): array
    {
        return [
            'liked_user_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del usuario al que se le da like',
            ],
        ];
    }

    public function authorize($root, array $args, $ctx, ?ResolveInfo $resolveInfo = null, ?Closure $getSelectFields = null): bool
    {
        return (bool) (auth('sanctum')->user() ?? auth('web')->user());
    }

    public function resolve($root, array $args)
    {
        $currentUser = auth('sanctum')->user() ?? auth('web')->user();
        if (! $currentUser) {
            throw new UserError('Unauthenticated');
        }

        $targetUser = User::findOrFail($args['liked_user_id']);

        if ($currentUser->id === $targetUser->id) {
            throw new UserError('No puedes darte like a ti mismo.');
        }

        $like = UserLike::where('user_id', $currentUser->id)
            ->where('liked_user_id', $targetUser->id)
            ->first();

        if ($like) {
            $like->delete();

            return null;
        }

        return UserLike::create([
            'user_id' => $currentUser->id,
            'liked_user_id' => $targetUser->id,
        ]);
    }
}
