<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PaginatorInfoType extends GraphQLType
{
    protected $attributes = [
        'name' => 'PaginatorInfo',
        'description' => 'Información de paginación',
    ];

    public function fields(): array
    {
        return [
            'count' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Número de elementos en la página actual',
            ],
            'currentPage' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Página actual',
            ],
            'firstItem' => [
                'type' => Type::int(),
                'description' => 'Índice del primer elemento',
            ],
            'hasMorePages' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'Si hay más páginas disponibles',
            ],
            'lastItem' => [
                'type' => Type::int(),
                'description' => 'Índice del último elemento',
            ],
            'lastPage' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Número de la última página',
            ],
            'perPage' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Elementos por página',
            ],
            'total' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Total de elementos',
            ],
        ];
    }
}
