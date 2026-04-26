<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\Like;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class LikeType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Like',
        'description' => 'Representa un like dado por un usuario a una galería',
        'model' => Like::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del like',
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario que dio el like',
            ],
            'gallery' => [
                'type' => GraphQL::type('Gallery'),
                'description' => 'Galería que recibió el like',
            ],
            'created_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de creación del like',
                'resolve' => function ($model) {
                    return $model->created_at->toIso8601String();
                },
            ],
        ];
    }
}
