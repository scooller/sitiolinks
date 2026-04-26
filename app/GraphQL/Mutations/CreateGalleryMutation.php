<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\SiteSettings;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Rebing\GraphQL\Error\AuthorizationError;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class CreateGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createGallery',
        'description' => 'Crear una nueva galería',
    ];

    public function type(): Type
    {
        return GraphQL::type('Gallery');
    }

    public function args(): array
    {
        return [
            'title' => [
                'name' => 'title',
                'type' => Type::nonNull(Type::string()),
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
                'defaultValue' => Gallery::VISIBILITY_PUBLIC,
            ],
            'order' => [
                'name' => 'order',
                'type' => Type::int(),
                'description' => 'Orden de visualización',
                'defaultValue' => 0,
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        Log::info('GraphQL createGallery auth debug: entering', [
            'auth_check' => Auth::check(),
            'default_guard' => config('auth.defaults.guard'),
            'session_id' => session()->getId(),
            'cookies' => request()->cookies->all(),
            'headers_origin' => request()->headers->get('origin'),
            'headers_referer' => request()->headers->get('referer'),
            'route_middleware' => config('graphql.route.middleware'),
        ]);

        $user = Auth::guard(config('auth.defaults.guard'))->user()
            ?? Auth::guard('web')->user()
            ?? Auth::user()
            ?? request()->user();

        if (! $user) {
            Log::warning('GraphQL createGallery auth debug: no user resolved', [
                'auth_check' => Auth::check(),
                'session_id' => session()->getId(),
            ]);
            throw new AuthorizationError('Unauthenticated');
        }

        // Solo admin, super_admin y creator pueden crear galerías
        $allowedRoles = ['admin', 'super_admin', 'creator'];
        if (! $user->hasAnyRole($allowedRoles)) {
            throw new AuthorizationError('No tienes permisos para crear galerías. Solo administradores y creadores pueden crear galerías.');
        }

        // Verificar límite de galerías según el rol
        $this->checkGalleryLimit($user);

        // Validar visibilidad
        $validVisibilities = [
            Gallery::VISIBILITY_PUBLIC,
            Gallery::VISIBILITY_PRIVATE,
            Gallery::VISIBILITY_FOLLOWERS,
        ];

        if (isset($args['visibility']) && ! in_array($args['visibility'], $validVisibilities)) {
            throw new \Exception('Visibilidad no válida. Opciones: '.implode(', ', $validVisibilities));
        }

        $gallery = Gallery::create([
            'user_id' => $user->id,
            'title' => $args['title'],
            'description' => $args['description'] ?? null,
            'visibility' => $args['visibility'] ?? Gallery::VISIBILITY_PUBLIC,
            'order' => $args['order'] ?? 0,
            'status' => $user->hasAnyRole(['admin', 'super_admin']) ? Gallery::STATUS_APPROVED : Gallery::STATUS_PENDING,
        ]);

        return $gallery;
    }

    /**
     * Verifica el límite de galerías según el rol del usuario
     */
    protected function checkGalleryLimit($user): void
    {
        // Admin y super_admin siempre tienen ilimitado
        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            return;
        }

        $currentCount = Gallery::where('user_id', $user->id)->count();
        $settings = SiteSettings::first();

        // Si el usuario es VIP
        if ($user->hasRole('vip')) {
            $vipLimit = $settings?->max_galleries_vip;
            // null = ilimitado
            if ($vipLimit !== null && $currentCount >= $vipLimit) {
                throw new \Exception("Has alcanzado el límite de {$vipLimit} galerías permitidas para usuarios VIP.");
            }

            return;
        }

        // Si solo es creator (o tiene creator pero no vip)
        if ($user->hasRole('creator')) {
            $creatorLimit = $settings?->max_galleries_creator ?? 5;
            if ($currentCount >= $creatorLimit) {
                throw new \Exception("Has alcanzado el límite de {$creatorLimit} galerías permitidas. Considera actualizar a VIP para más galerías.");
            }

            return;
        }

        // Si llegó aquí sin ser admin, vip ni creator, no debería poder crear (ya se validó antes)
        throw new AuthorizationError('No tienes permisos para crear galerías.');
    }
}
