<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class GalleryPaginatorType extends GraphQLType
{
    protected $attributes = [
        'name' => 'GalleryPaginator',
        'description' => 'Resultado paginado de galerías',
    ];

    public function fields(): array
    {
        return [
            'data' => [
                'type' => Type::listOf(GraphQL::type('Gallery')),
                'description' => 'Lista de galerías',
            ],
            'paginatorInfo' => [
                'type' => GraphQL::type('PaginatorInfo'),
                'description' => 'Información de paginación',
            ],
        ];
    }
}
