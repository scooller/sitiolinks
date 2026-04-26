<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ToggleFeaturedGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'toggleFeaturedGallery',
        'description' => 'Destacar o quitar destacado de una galería (solo VIP/admin)',
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
            'is_featured' => [
                'name' => 'is_featured',
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'True para destacar, false para quitar destacado',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        $gallery = Gallery::findOrFail($args['id']);

        // Verificar que sea el propietario
        if ($gallery->user_id !== $user->id) {
            $roleNames = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_type', User::class)
                ->where('model_has_roles.model_id', $user->id)
                ->pluck('roles.name')
                ->toArray();

            $isAdmin = in_array('admin', $roleNames, true) || in_array('super_admin', $roleNames, true);
            if (! $isAdmin) {
                throw new UserError('No autorizado para gestionar esta galería');
            }
        }

        // Verificar que la galería pueda ser destacada
        if ($args['is_featured'] && ! $gallery->canBeFeatured()) {
            throw new UserError('Esta galería no puede ser destacada. Debe estar aprobada y ser pública.');
        }

        // Si se está destacando, verificar límite
        if ($args['is_featured']) {
            $limit = $gallery->getFeaturedLimit();

            if ($limit !== null) {
                $currentCount = Gallery::where('user_id', $gallery->user_id)
                    ->where('is_featured', true)
                    ->where('id', '!=', $gallery->id)
                    ->count();

                if ($currentCount >= $limit) {
                    throw new UserError("Has alcanzado el límite de {$limit} galerías destacadas. Quita el destacado de otra galería primero.");
                }
            }
        }

        // Actualizar estado
        $gallery->is_featured = $args['is_featured'];
        $gallery->featured_at = $args['is_featured'] ? now() : null;
        $gallery->save();

        return $gallery->fresh(['user', 'media']);
    }
}
