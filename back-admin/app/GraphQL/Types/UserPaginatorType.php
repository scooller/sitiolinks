<?php

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class UserPaginatorType extends GraphQLType
{
    protected $attributes = [
        'name' => 'UserPaginator',
        'description' => 'Resultado paginado de usuarios',
    ];

    public function fields(): array
    {
        return [
            'data' => [
                'type' => Type::listOf(GraphQL::type('User')),
                'description' => 'Lista de usuarios de la página actual',
            ],
            'paginatorInfo' => [
                'type' => GraphQL::type('PaginatorInfo'),
                'description' => 'Información de paginación',
            ],
        ];
    }
}
