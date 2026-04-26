<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Gallery;
use App\Models\Like;
use App\Models\User;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ToggleLikeMutation extends Mutation
{
    protected $attributes = [
        'name' => 'toggleLike',
        'description' => 'Da o quita un like a una galería. Devuelve el estado actual del like.',
    ];

    public function type(): Type
    {
        // La mutación puede devolver un Like si se crea, o null si se elimina.
        return GraphQL::type('Like');
    }

    public function args(): array
    {
        return [
            'gallery_id' => [
                'name' => 'gallery_id',
                'type' => Type::nonNull(Type::int()),
                'rules' => ['required', 'integer', 'exists:galleries,id'],
            ],
        ];
    }

    protected function rules(array $args = []): array
    {
        return [
            'gallery_id' => ['required', 'integer', 'exists:galleries,id'],
        ];
    }

    public function authorize($root, array $args, $ctx, ?ResolveInfo $resolveInfo = null, ?Closure $getSelectFields = null): bool
    {
        // Solo usuarios autenticados pueden dar like
        return (bool) auth('web')->user();
    }

    public function resolve($root, array $args)
    {
        /** @var User $user */
        $user = auth('web')->user();
        $galleryId = $args['gallery_id'];

        $gallery = Gallery::findOrFail($galleryId);

        // Verificar si el usuario puede ver la galería antes de darle like
        if (! $gallery->isVisibleTo($user)) {
            throw new \Exception('No tienes permiso para ver esta galería.');
        }

        $like = Like::where('user_id', $user->id)
            ->where('gallery_id', $galleryId)
            ->first();

        if ($like) {
            // Si ya existe el like, se elimina (unlike)
            $like->delete();

            return null; // Devolvemos null para indicar que se eliminó
        } else {
            // Si no existe, se crea (like)
            $newLike = Like::create([
                'user_id' => $user->id,
                'gallery_id' => $galleryId,
            ]);

            return $newLike; // Devolvemos el nuevo like
        }
    }
}
