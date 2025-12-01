<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AddMediaToGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'addMediaToGallery',
        'description' => 'Agregar imágenes a una galería',
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
                'description' => 'IDs de los medios a agregar',
            ],
            'captions' => [
                'name' => 'captions',
                'type' => Type::listOf(Type::string()),
                'description' => 'Descripciones para cada imagen (opcional, mismo orden que media_ids)',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        // Obtener nombres de roles del usuario sin depender de métodos del trait
        $roleNames = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', User::class)
            ->where('model_has_roles.model_id', $user->id)
            ->pluck('roles.name')
            ->toArray();

        // Solo admin, super_admin, creator y vip pueden gestionar galerías
        $allowedRoles = ['admin', 'super_admin', 'creator', 'vip'];
        $hasAllowedRole = count(array_intersect($allowedRoles, $roleNames)) > 0;
        if (! $hasAllowedRole) {
            throw new UserError('No tienes permisos para gestionar galerías. Solo administradores y creadores pueden hacerlo.');
        }

        $gallery = Gallery::findOrFail($args['gallery_id']);

        // Verificar que sea el propietario (los admins pueden gestionar todas)
        $isAdminRole = in_array('admin', $roleNames, true) || in_array('super_admin', $roleNames, true);
        if ($gallery->user_id !== $user->id && ! $isAdminRole) {
            throw new UserError('No autorizado para gestionar medios de esta galería');
        }

        $mediaIds = $args['media_ids'];
        $captions = $args['captions'] ?? [];

        // Reglas de límite de medios por galería según rol
        // Admin/super_admin: ilimitado
        $isAdmin = $isAdminRole;
        if (! $isAdmin) {
            $settings = \App\Models\SiteSettings::first();

            // Determinar límite según rol
            $limit = null; // null = ilimitado
            if (in_array('vip', $roleNames, true)) {
                $limit = $settings?->max_media_per_gallery_vip; // puede ser null
            } elseif (in_array('creator', $roleNames, true)) {
                $limit = $settings?->max_media_per_gallery_creator ?? 20;
            }

            if ($limit !== null) {
                $currentCount = $gallery->media()->count();
                $remaining = $limit - $currentCount;

                if ($remaining <= 0) {
                    throw new UserError("Has alcanzado el límite de {$limit} imágenes para esta galería. Elimina algunas para liberar espacio.");
                }

                if (count($mediaIds) > $remaining) {
                    throw new UserError('Intentas agregar '.count($mediaIds)." imágenes, pero solo quedan {$remaining} disponibles (límite: {$limit}).");
                }
            }
        }

        // Obtener el último orden actual
        $maxOrder = $gallery->media()->max('gallery_media.order') ?? -1;

        foreach ($mediaIds as $index => $mediaId) {
            // Verificar que el medio existe
            $media = Media::find($mediaId);
            if (! $media) {
                continue; // Saltar medios que no existen
            }

            // Preparar datos del pivot
            $pivotData = [
                'order' => $maxOrder + $index + 1,
                'caption' => $captions[$index] ?? null,
            ];

            // Adjuntar o actualizar si ya existe
            if (! $gallery->media()->where('media_id', $mediaId)->exists()) {
                $gallery->media()->attach($mediaId, $pivotData);
            }
        }

        // Recargar la relación
        $gallery->load('media');

        return $gallery;
    }
}
