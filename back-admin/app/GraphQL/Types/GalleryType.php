<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\Gallery;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class GalleryType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Gallery',
        'description' => 'Una galería de imágenes del usuario',
        'model' => Gallery::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería',
            ],
            'user_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del usuario propietario',
            ],
            'title' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Título de la galería',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => 'Descripción de la galería',
            ],
            'visibility' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Visibilidad: public, private, followers',
            ],
            'status' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Estado de moderación: pending, approved, rejected',
            ],
            'order' => [
                'type' => Type::int(),
                'description' => 'Orden de la galería',
            ],
            'created_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de creación',
                'resolve' => function ($root) {
                    return $root->created_at ? $root->created_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'updated_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de última actualización',
                'resolve' => function ($root) {
                    return $root->updated_at ? $root->updated_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario propietario',
            ],
            'media' => [
                'type' => Type::listOf(GraphQL::type('GalleryMediaItem')),
                'description' => 'Medios de la galería',
                'resolve' => function ($root) {
                    return $root->media;
                },
            ],
            'media_count' => [
                'type' => Type::int(),
                'description' => 'Cantidad de medios en la galería',
                'resolve' => function ($root) {
                    return $root->media()->count();
                },
            ],
            'can_view' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario actual puede ver esta galería',
                'resolve' => function ($root) {
                    $user = auth('web')->user();

                    return $root->isVisibleTo($user);
                },
            ],
            'allowed_user_ids' => [
                'type' => Type::listOf(Type::int()),
                'description' => 'IDs de usuarios permitidos para ver una galería privada (solo visible para el propietario)',
                'resolve' => function ($root) {
                    $user = auth('web')->user();
                    if ($user && ($user->id === $root->user_id)) {
                        return $root->allowedUsers()->pluck('users.id')->toArray();
                    }

                    return [];
                },
            ],
            'can_moderate' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario actual puede moderar la galería',
                'resolve' => function ($root) {
                    $user = auth('web')->user();
                    if (! $user) {
                        return false;
                    }
                    $roleNames = DB::table('model_has_roles')
                        ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                        ->where('model_has_roles.model_type', get_class($user))
                        ->where('model_has_roles.model_id', $user->id)
                        ->pluck('roles.name')
                        ->toArray();

                    return count(array_intersect($roleNames, ['admin', 'super_admin', 'moderator'])) > 0;
                },
            ],
            'is_featured' => [
                'type' => Type::boolean(),
                'description' => 'Si la galería está destacada',
            ],
            'featured_at' => [
                'type' => Type::string(),
                'description' => 'Fecha en que se destacó la galería',
                'resolve' => function ($root) {
                    return $root->featured_at ? $root->featured_at->toIso8601String() : null;
                },
            ],
            'likes_count' => [
                'type' => Type::int(),
                'description' => 'Número total de likes en la galería',
                'selectable' => false, // Este campo se calcula con una subconsulta o withCount
                'resolve' => function (Gallery $gallery) {
                    // Si el campo ya fue cargado con withCount, lo usamos.
                    if (isset($gallery->likes_count)) {
                        return $gallery->likes_count;
                    }

                    // Fallback por si no se usó withCount
                    return $gallery->likes()->count();
                },
            ],
            'liked_by_user' => [
                'type' => Type::boolean(),
                'description' => 'Indica si el usuario autenticado actualmente ha dado like a esta galería',
                'selectable' => false, // Se resuelve dinámicamente
                'resolve' => function (Gallery $gallery) {
                    /** @var ?\App\Models\User $user */
                    $user = auth('web')->user();
                    if (! $user) {
                        return false;
                    }

                    // Usamos el método que creamos en el modelo Gallery
                    return $gallery->likedByUser($user);
                },
            ],
        ];
    }
}
