<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\Media;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Log;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class RemoveMediaFromGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'removeMediaFromGallery',
        'description' => 'Quitar imágenes de una galería',
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
                'description' => 'IDs de los medios a quitar',
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

        Log::info('RemoveMediaFromGallery: Eliminando medios', [
            'gallery_id' => $args['gallery_id'],
            'media_ids' => $args['media_ids'],
        ]);

        // Obtener los medios antes de eliminar
        $mediaToDelete = Media::whereIn('id', $args['media_ids'])
            ->where('collection_name', 'gallery')
            ->get();

        Log::info('RemoveMediaFromGallery: Medios encontrados', [
            'count' => $mediaToDelete->count(),
        ]);

        // Primero desadjuntar de la galería
        $gallery->media()->detach($args['media_ids']);

        // Luego eliminar cada medio (esto borra archivos físicos y registro de DB)
        foreach ($mediaToDelete as $media) {
            // Verificar que el medio no esté asociado a otras galerías
            $otherGalleries = $media->galleries()->where('gallery_id', '!=', $gallery->id)->count();

            if ($otherGalleries === 0) {
                Log::info('RemoveMediaFromGallery: Eliminando medio físicamente', [
                    'media_id' => $media->id,
                    'file_name' => $media->file_name,
                ]);
                $media->delete(); // Spatie elimina archivos físicos automáticamente
            } else {
                Log::info('RemoveMediaFromGallery: Medio compartido con otras galerías, no se elimina', [
                    'media_id' => $media->id,
                    'other_galleries_count' => $otherGalleries,
                ]);
            }
        }

        // Recargar la relación
        $gallery->load('media');

        Log::info('RemoveMediaFromGallery: Medios eliminados correctamente');

        return $gallery;
    }
}
