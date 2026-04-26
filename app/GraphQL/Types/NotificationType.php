<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class NotificationType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Notification',
        'description' => 'Una notificación para el usuario',
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID de la notificación',
            ],
            'user_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del usuario destinatario',
            ],
            'type' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Tipo de notificación (follow, gallery_featured, etc.)',
            ],
            'title' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Título de la notificación',
            ],
            'message' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Mensaje descriptivo',
            ],
            'data' => [
                'type' => Type::string(),
                'description' => 'Datos adicionales en formato JSON',
                'resolve' => fn ($root) => $root->data ? json_encode($root->data) : null,
            ],
            'url' => [
                'type' => Type::string(),
                'description' => 'URL opcional asociada',
            ],
            'read_at' => [
                'type' => Type::string(),
                'description' => 'Fecha y hora de lectura',
                'resolve' => fn ($root) => $root->read_at?->toIso8601String(),
            ],
            'created_at' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Fecha de creación',
                'resolve' => fn ($root) => $root->created_at->toIso8601String(),
            ],
        ];
    }
}
