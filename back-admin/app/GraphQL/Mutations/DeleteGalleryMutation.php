<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\Media;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;

class DeleteGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteGallery',
        'description' => 'Eliminar una galería',
    ];

    public function type(): Type
    {
        return Type::boolean();
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería a eliminar',
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

        // Verificar que sea el propietario (los admins pueden eliminar todas)
        if ($gallery->user_id !== $user->id && ! $user->hasRole(['admin', 'super_admin'])) {
            throw new \Exception('No autorizado para eliminar esta galería');
        }

        // Obtener todos los medios de la galería
        $mediaIds = $gallery->media()->pluck('media.id')->toArray();

        // Eliminar la galería (cascade eliminará las relaciones en gallery_media)
        $gallery->delete();

        // Eliminar los medios físicos que no estén asociados a otras galerías
        if (! empty($mediaIds)) {
            $mediaToDelete = Media::whereIn('id', $mediaIds)
                ->where('collection_name', 'gallery')
                ->whereDoesntHave('galleries')
                ->get();

            foreach ($mediaToDelete as $media) {
                $media->delete(); // Spatie elimina archivos físicos automáticamente
            }
        }

        return true;
    }
}
