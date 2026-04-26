<?php

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class SystemStatsType extends GraphQLType
{
    protected $attributes = [
        'name' => 'SystemStats',
        'description' => 'Estadísticas del sistema',
    ];

    public function fields(): array
    {
        return [
            'total_users' => [
                'type' => Type::int(),
                'description' => 'Total de usuarios registrados',
            ],
            'total_creators' => [
                'type' => Type::int(),
                'description' => 'Total de usuarios con rol creator',
            ],
            'total_vips' => [
                'type' => Type::int(),
                'description' => 'Total de usuarios con rol VIP',
            ],
            'total_galleries' => [
                'type' => Type::int(),
                'description' => 'Total de galerías creadas',
            ],
            'approved_galleries' => [
                'type' => Type::int(),
                'description' => 'Galerías aprobadas',
            ],
            'pending_galleries' => [
                'type' => Type::int(),
                'description' => 'Galerías pendientes de aprobación',
            ],
            'total_media' => [
                'type' => Type::int(),
                'description' => 'Total de archivos media',
            ],
            'total_storage_mb' => [
                'type' => Type::float(),
                'description' => 'Espacio total usado en MB',
            ],
            'total_follows' => [
                'type' => Type::int(),
                'description' => 'Total de relaciones follow',
            ],
            'total_views' => [
                'type' => Type::int(),
                'description' => 'Total de vistas de perfil',
            ],
            'total_galleries' => [
                'type' => Type::int(),
                'description' => 'Total de galerías',
            ],
            'new_users_last_7_days' => [
                'type' => Type::int(),
                'description' => 'Nuevos usuarios en los últimos 7 días',
            ],
            'new_galleries_last_7_days' => [
                'type' => Type::int(),
                'description' => 'Nuevas galerías en los últimos 7 días',
            ],
        ];
    }
}
