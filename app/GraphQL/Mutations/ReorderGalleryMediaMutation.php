<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ReorderGalleryMediaMutation extends Mutation
{
    protected $attributes = [
        'name' => 'reorderGalleryMedia',
        'description' => 'Reordenar las imágenes de una galería',
    ];

    public function type(): Type
    {
        return GraphQL::type('Gallery');
    }

    public function args(): array
    {
        return [
            'gallery_id' => [
                'name' => 'gallery_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería',
            ],
            'media_ids' => [
                'name' => 'media_ids',
                'type' => Type::nonNull(Type::listOf(Type::int())),
                'description' => 'IDs de los medios en el nuevo orden',
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

        $gallery = Gallery::findOrFail($args['gallery_id']);

        // Verificar que sea el propietario (los admins pueden gestionar todas)
        if ($gallery->user_id !== $user->id && ! $user->hasRole(['admin', 'super_admin'])) {
            throw new \Exception('No autorizado para gestionar medios de esta galería');
        }

        $mediaIds = $args['media_ids'];

        // Actualizar el orden de cada medio
        foreach ($mediaIds as $order => $mediaId) {
            $gallery->media()
                ->where('media_id', $mediaId)
                ->update(['gallery_media.order' => $order]);
        }

        // Recargar la relación
        $gallery->load('media');

        return $gallery;
    }
}
