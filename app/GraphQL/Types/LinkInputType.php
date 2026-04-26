<?php

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\InputType;

class LinkInputType extends InputType
{
    protected $attributes = [
        'name' => 'LinkInput',
        'description' => 'Input type para crear/actualizar links',
    ];

    public function fields(): array
    {
        return [
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Nombre del link',
            ],
            'url' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'URL del link',
            ],
            'icon' => [
                'type' => Type::string(),
                'description' => 'Icono del link (ej: fas-link)',
            ],
        ];
    }
}
