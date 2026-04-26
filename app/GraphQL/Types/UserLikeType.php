<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\UserLike;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class UserLikeType extends GraphQLType
{
    protected $attributes = [
        'name' => 'UserLike',
        'description' => 'Representa un like dado por un usuario a un perfil de usuario',
        'model' => UserLike::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'user' => [
                'type' => GraphQL::type('User'),
            ],
            'liked_user' => [
                'type' => GraphQL::type('User'),
                'resolve' => function ($model) {
                    return $model->likedUser;
                },
            ],
            'created_at' => [
                'type' => Type::string(),
                'resolve' => function ($model) {
                    return $model->created_at->toIso8601String();
                },
            ],
        ];
    }
}
