<?php

namespace App\GraphQL\Types;

use App\Models\User;
use App\Models\UserLike;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class UserType extends GraphQLType
{
    protected $attributes = [
        'name' => 'User',
        'description' => 'Usuario del sistema',
        'model' => User::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::string(),
                'resolve' => function (User $user) {
                    $currentUser = auth('web')->user() ?? auth('sanctum')->user();
                    if (! $currentUser) {
                        return null;
                    }
                    if ($currentUser->id === $user->id || $currentUser->hasAnyRole(['super_admin', 'admin', 'moderator'])) {
                        return $user->name;
                    }

                    return null;
                },
            ],
            'username' => [
                'type' => Type::string(),
            ],
            'email' => [
                'type' => Type::string(),
            ],
            'email_verified_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de verificación del email',
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->email_verified_at?->toIso8601String();
                },
            ],
            'views' => [
                'type' => Type::int(),
                'description' => 'Número de veces que se ha visitado el perfil',
            ],
            'followers_count' => [
                'type' => Type::int(),
                'description' => 'Número de seguidores',
            ],
            'following_count' => [
                'type' => Type::int(),
                'description' => 'Número de usuarios que sigue',
            ],
            'likes_count' => [
                'type' => Type::int(),
                'description' => 'Número de "me gusta" recibidos en el perfil',
                'selectable' => false,
                'resolve' => function (User $user) {
                    return UserLike::where('liked_user_id', $user->id)->count();
                },
            ],
            'liked_by_user' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario autenticado dio like a este perfil',
                'selectable' => false,
                'resolve' => function (User $user) {
                    $currentUser = auth('sanctum')->user() ?? auth('web')->user();
                    if (! $currentUser) {
                        return false;
                    }

                    return UserLike::where('user_id', $currentUser->id)
                        ->where('liked_user_id', $user->id)
                        ->exists();
                },
            ],
            'is_following' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario autenticado sigue a este usuario',
                'selectable' => false,
                'resolve' => function (User $user) {
                    $currentUser = auth('web')->user() ?? auth('sanctum')->user();
                    if (! $currentUser) {
                        return false;
                    }

                    return $currentUser->isFollowing($user);
                },
            ],
            'nationality' => [
                'type' => Type::string(),
            ],
            'country' => [
                'type' => Type::string(),
            ],
            'city' => [
                'type' => Type::string(),
            ],
            'description' => [
                'type' => Type::string(),
            ],
            'gender' => [
                'type' => Type::string(),
                'description' => 'Sexo: hombre, mujer, trans, otro',
            ],
            'country_block' => [
                'type' => Type::boolean(),
            ],
            'birth_date' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->birth_date?->toDateString();
                },
            ],
            'price_from' => [
                'type' => Type::float(),
            ],
            'card_bg_color' => [
                'type' => Type::string(),
                'description' => 'Color de fondo de la card en el perfil',
                'resolve' => function ($root) {
                    return $root->card_bg_color;
                },
            ],
            'card_bg_opacity' => [
                'type' => Type::float(),
                'description' => 'Opacidad del fondo de la card en el perfil (0.1-1)',
                'resolve' => function ($root) {
                    return $root->card_bg_opacity;
                },
            ],
            'avatar_url' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar');
                },
            ],
            'avatar_thumb' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar', 'thumb');
                },
            ],
            'avatar_thumb_webp' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar', 'thumb_webp');
                },
            ],
            'avatar_small_webp' => [
                'type' => Type::string(),
                'selectable' => false,
                'description' => 'Avatar pequeño WebP para móviles (120x120)',
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar', 'avatar_small_webp');
                },
            ],
            'avatar_medium_webp' => [
                'type' => Type::string(),
                'selectable' => false,
                'description' => 'Avatar mediano WebP para tablets (240x240)',
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar', 'avatar_medium_webp');
                },
            ],
            'avatar_webp' => [
                'type' => Type::string(),
                'selectable' => false,
                'description' => 'Avatar completo en formato WebP (500x500)',
                'resolve' => function (User $user) {
                    return $user->getFirstMediaUrl('avatar', 'avatar_webp');
                },
            ],
            'tags' => [
                'type' => Type::listOf(GraphQL::type('Tag')),
            ],
            'links' => [
                'type' => Type::listOf(GraphQL::type('Link')),
            ],
            'has_public_profile' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario tiene un perfil público (admin, moderator, creator)',
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->hasAnyRole(['admin', 'moderator', 'creator']);
                },
            ],
            'roles' => [
                'type' => Type::listOf(GraphQL::type('Role')),
                'description' => 'Roles asignados al usuario',
            ],
            'email_notifications' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario desea recibir notificaciones por email',
            ],
            'is_verified' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario está verificado',
            ],
            'verified_at' => [
                'type' => Type::string(),
                'description' => 'Fecha de verificación del usuario',
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->verified_at?->toIso8601String();
                },
            ],
            'galleries_count' => [
                'type' => Type::int(),
                'description' => 'Número de galerías públicas y aprobadas del usuario',
                'selectable' => false,
                'resolve' => function (User $user) {
                    return $user->galleries()
                        ->where('visibility', 'public')
                        ->where('status', 'approved')
                        ->count();
                },
            ],
            'warning_modal_dismissed' => [
                'type' => Type::boolean(),
                'description' => 'Si el usuario ha descartado el modal de advertencia',
            ],
        ];
    }
}
