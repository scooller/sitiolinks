<?php

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ModerateGalleryMutation extends Mutation
{
    protected $attributes = [
        'name' => 'moderateGallery',
        'description' => 'Cambiar el estado de moderación de una galería (pending → approved/rejected)',
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
            'status' => [
                'name' => 'status',
                'type' => Type::nonNull(Type::string()),
                'description' => 'Nuevo estado: approved o rejected',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();
        if (! $user) {
            throw new UserError('No autenticado');
        }

        // Obtener roles sin depender del trait
        $roleNames = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', User::class)
            ->where('model_has_roles.model_id', $user->id)
            ->pluck('roles.name')
            ->toArray();

        $isModerator = count(array_intersect($roleNames, ['admin', 'super_admin', 'moderator'])) > 0;
        if (! $isModerator) {
            throw new UserError('No tienes permisos para moderar galerías');
        }

        $gallery = Gallery::findOrFail($args['gallery_id']);

        $newStatus = strtolower($args['status']);
        if (! in_array($newStatus, [Gallery::STATUS_APPROVED, Gallery::STATUS_REJECTED], true)) {
            throw new UserError('Estado inválido. Usa approved o rejected');
        }

        // Solo se puede moderar si está pending (o se permite re-moderar rechazadas a approved)
        if (! in_array($gallery->status, [Gallery::STATUS_PENDING, Gallery::STATUS_REJECTED], true)) {
            throw new UserError('La galería ya está aprobada y no requiere moderación');
        }

        $gallery->status = $newStatus;
        $gallery->save();
        $gallery->refresh();

        return $gallery;
    }
}
