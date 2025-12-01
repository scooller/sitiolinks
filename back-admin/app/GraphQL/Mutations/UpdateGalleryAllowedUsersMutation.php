<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;

class UpdateGalleryAllowedUsersMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateGalleryAllowedUsers',
        'description' => 'Actualiza la lista de usuarios permitidos para una galería privada',
    ];

    public function type(): Type
    {
        return Type::boolean();
    }

    public function args(): array
    {
        return [
            'gallery_id' => [
                'name' => 'gallery_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería',
            ],
            'user_ids' => [
                'name' => 'user_ids',
                'type' => Type::nonNull(Type::listOf(Type::int())),
                'description' => 'IDs de usuarios a permitir',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $current = auth('web')->user();
        if (! $current) {
            throw new \Exception('No autenticado');
        }

        $gallery = Gallery::findOrFail($args['gallery_id']);

        // Solo propietario o admin
        if ($gallery->user_id !== $current->id && ! $current->hasAnyRole(['admin', 'super_admin'])) {
            throw new \Exception('No autorizado');
        }

        // Solo tiene sentido para galerías privadas
        if ($gallery->visibility !== Gallery::VISIBILITY_PRIVATE) {
            // Aún así permitimos guardar para preconfigurar, pero no afecta visibilidad
        }

        // Filtrar a solo seguidores del propietario
        $followersIds = $gallery->user->followers()->pluck('users.id')->toArray();
        $allowed = array_values(array_intersect($args['user_ids'], $followersIds));

        // Sincronizar pivot
        $gallery->allowedUsers()->sync($allowed);

        return true;
    }
}
