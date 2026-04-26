<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PageType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Page',
        'description' => 'Una página del sitio',
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la página',
            ],
            'title' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Título de la página',
            ],
            'slug' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Slug único de la página',
            ],
            'content' => [
                'type' => Type::string(),
                'description' => 'Contenido HTML de la página',
            ],
            'status' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Estado de la página (draft, published)',
            ],
            'order' => [
                'type' => Type::int(),
                'description' => 'Orden de la página en menús',
            ],
            'is_system' => [
                'type' => Type::boolean(),
                'description' => 'Indica si es una página del sistema',
            ],
            'created_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de creación',
            ],
            'updated_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de última actualización',
            ],
        ];
    }
}
