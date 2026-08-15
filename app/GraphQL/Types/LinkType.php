<?php

namespace App\GraphQL\Types;

use App\Models\Link;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class LinkType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Link',
        'description' => 'Link personalizado del usuario',
        'model' => Link::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::string(),
            ],
            'url' => [
                'type' => Type::string(),
            ],
            'icon' => [
                'type' => Type::string(),
            ],
            'is_adult' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'Marca el link como contenido +18',
            ],
            'order' => [
                'type' => Type::int(),
            ],
        ];
    }
}
