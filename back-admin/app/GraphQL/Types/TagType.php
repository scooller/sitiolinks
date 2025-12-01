<?php

namespace App\GraphQL\Types;

use App\Models\Tag;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class TagType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Tag',
        'description' => 'Etiqueta del sistema',
        'model' => Tag::class,
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
            'name_en' => [
                'type' => Type::string(),
            ],
            'color' => [
                'type' => Type::string(),
            ],
            'icon' => [
                'type' => Type::string(),
            ],
            'weight' => [
                'type' => Type::int(),
            ],
            'is_fixed' => [
                'type' => Type::boolean(),
                'alias' => 'is_fixed',
            ],
            'created_at' => [
                'type' => Type::string(),
            ],
            'updated_at' => [
                'type' => Type::string(),
            ],
        ];
    }
}
