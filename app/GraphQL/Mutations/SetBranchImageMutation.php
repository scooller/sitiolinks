<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\CafeBranch;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SetBranchImageMutation extends Mutation
{
    protected $attributes = [
        'name' => 'setBranchImage',
        'description' => 'Establecer la imagen de una sucursal de café usando un media_id previamente subido',
    ];

    public function type(): Type
    {
        return GraphQL::type('CafeBranch');
    }

    public function args(): array
    {
        return [
            'branch_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID de la sucursal',
            ],
            'media_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del media subido',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $user = Auth::user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        $branch = CafeBranch::findOrFail((int) $args['branch_id']);
        // Verificar permisos: solo creadores de la sucursal o admins
        $isCreator = $branch->creators()->where('users.id', $user->id)->exists();
        if (! $isCreator && ! $user->hasRole(['admin', 'super_admin'])) {
            throw new UserError('No autorizado para modificar esta sucursal');
        }

        // Verificar que el media existe y pertenece al usuario
        $media = Media::find($args['media_id']);

        if (! $media) {
            throw new UserError('Media no encontrado');
        }

        if ($media->model_type !== User::class || $media->model_id !== $user->id) {
            throw new UserError('Este media no pertenece a tu cuenta');
        }

        if (! in_array($media->collection_name, ['branch_image_temp', 'branch_image'], true)) {
            throw new UserError('El media no es una imagen de sucursal válida');
        }

        try {
            // Eliminar imagen anterior si existe
            $branch->clearMediaCollection('branch_image');

            // Cambiar la colección del media a 'branch_image'
            $media->collection_name = 'branch_image';
            $media->save();

            // Actualizar el campo image_url con la URL del media
            $branch->update([
                'image_url' => $media->getUrl(),
            ]);

            return $branch->fresh();
        } catch (\Exception $e) {
            throw new UserError('Error al actualizar la imagen: '.$e->getMessage());
        }
    }
}
