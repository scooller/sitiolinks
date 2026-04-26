<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Cafe;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SetCafeImageMutation extends Mutation
{
    protected $attributes = [
        'name' => 'setCafeImage',
        'description' => 'Establecer la imagen de un café usando un media_id previamente subido',
    ];

    public function type(): Type
    {
        return GraphQL::type('Cafe');
    }

    public function args(): array
    {
        return [
            'cafe_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del café',
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

        $cafe = Cafe::findOrFail((int) $args['cafe_id']);

        // Verificar permisos: solo creadores asociados a sucursales del café o admins
        $isCreator = $cafe->branches()
            ->whereHas('creators', function ($query) use ($user): void {
                $query->where('users.id', $user->id);
            })
            ->exists();
        if (! $isCreator && ! $user->hasRole(['admin', 'super_admin'])) {
            throw new UserError('No autorizado para modificar este café');
        }

        // Verificar que el media existe y pertenece al usuario
        $media = Media::find($args['media_id']);

        if (! $media) {
            throw new UserError('Media no encontrado');
        }

        if ($media->model_type !== User::class || $media->model_id !== $user->id) {
            throw new UserError('Este media no pertenece a tu cuenta');
        }

        if (! in_array($media->collection_name, ['cafe_image_temp', 'cafe_image'], true)) {
            throw new UserError('El media no es una imagen de café válida');
        }

        try {
            // Eliminar imagen anterior si existe
            $cafe->clearMediaCollection('cafe_image');

            // Cambiar la colección del media a 'cafe_image'
            $media->collection_name = 'cafe_image';
            $media->save();

            // Actualizar el campo image_url con la URL del media
            $cafe->update([
                'image_url' => $media->getUrl(),
            ]);

            return $cafe->fresh();
        } catch (\Exception $e) {
            throw new UserError('Error al actualizar la imagen: '.$e->getMessage());
        }
    }
}
