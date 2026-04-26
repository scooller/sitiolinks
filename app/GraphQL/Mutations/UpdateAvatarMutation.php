<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class UpdateAvatarMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateAvatar',
        'description' => 'Actualiza el avatar del usuario autenticado usando un media_id previamente subido',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'media_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del media subido que será el nuevo avatar',
            ],
        ];
    }

    public function resolve($root, $args)
    {
        Log::info('UpdateAvatar: Iniciando', ['args' => $args]);

        $user = Auth::user();

        if (! $user) {
            Log::error('UpdateAvatar: Usuario no autenticado');
            throw new \Exception('No autenticado');
        }

        Log::info('UpdateAvatar: Usuario autenticado', ['user_id' => $user->id]);

        // Verificar que el media existe y pertenece al usuario
        $media = Media::find($args['media_id']);

        if (! $media) {
            Log::error('UpdateAvatar: Media no encontrado', ['media_id' => $args['media_id']]);
            throw new \Exception('Media no encontrado');
        }

        Log::info('UpdateAvatar: Media encontrado', [
            'media_id' => $media->id,
            'collection' => $media->collection_name,
            'model_type' => $media->model_type,
            'model_id' => $media->model_id,
        ]);

        if ($media->model_type !== User::class || $media->model_id !== $user->id) {
            Log::error('UpdateAvatar: Media no pertenece al usuario', [
                'media_model_id' => $media->model_id,
                'user_id' => $user->id,
            ]);
            throw new \Exception('Este media no pertenece a tu cuenta');
        }

        try {
            // Eliminar avatar anterior si existe
            Log::info('UpdateAvatar: Limpiando avatar anterior');
            $user->clearMediaCollection('avatar');

            // Cambiar la colección del media de 'avatar_temp' a 'avatar'
            Log::info('UpdateAvatar: Cambiando colección a avatar');
            $media->collection_name = 'avatar';
            $media->save();

            Log::info('UpdateAvatar: Avatar actualizado correctamente');

            // Recargar el usuario con el nuevo avatar
            return $user->fresh();
        } catch (\Exception $e) {
            Log::error('UpdateAvatar: Error al actualizar avatar', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
