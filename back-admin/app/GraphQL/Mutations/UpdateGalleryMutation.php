<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UpdateGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateGallery',
        'description' => 'Actualizar una galería existente',
    ];

    public function type(): Type
    {
        return GraphQL::type('Gallery');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería',
            ],
            'title' => [
                'name' => 'title',
                'type' => Type::string(),
                'description' => 'Título de la galería',
            ],
            'description' => [
                'name' => 'description',
                'type' => Type::string(),
                'description' => 'Descripción de la galería',
            ],
            'visibility' => [
                'name' => 'visibility',
                'type' => Type::string(),
                'description' => 'Visibilidad de la galería (public, private, followers)',
            ],
            'order' => [
                'name' => 'order',
                'type' => Type::int(),
                'description' => 'Orden de visualización',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new \Exception('No autenticado');
        }

        // Solo admin, super_admin y creator pueden gestionar galerías
        $allowedRoles = ['admin', 'super_admin', 'creator'];
        if (! $user->hasAnyRole($allowedRoles)) {
            throw new \Exception('No tienes permisos para gestionar galerías. Solo administradores y creadores pueden hacerlo.');
        }

        $gallery = Gallery::findOrFail($args['id']);

        // Verificar que sea el propietario (los admins pueden gestionar todas)
        if ($gallery->user_id !== $user->id && ! $user->hasRole(['admin', 'super_admin'])) {
            throw new \Exception('No autorizado para actualizar esta galería');
        }

        // Validar visibilidad si se proporciona
        if (isset($args['visibility'])) {
            $validVisibilities = [
                Gallery::VISIBILITY_PUBLIC,
                Gallery::VISIBILITY_PRIVATE,
                Gallery::VISIBILITY_FOLLOWERS,
            ];

            if (! in_array($args['visibility'], $validVisibilities)) {
                throw new \Exception('Visibilidad no válida. Opciones: '.implode(', ', $validVisibilities));
            }
        }

        // Actualizar solo los campos proporcionados
        $updateData = [];
        foreach (['title', 'description', 'visibility', 'order'] as $field) {
            if (array_key_exists($field, $args)) {
                $updateData[$field] = $args[$field];
            }
        }

        $gallery->update($updateData);
        $gallery->refresh();

        return $gallery;
    }
}
