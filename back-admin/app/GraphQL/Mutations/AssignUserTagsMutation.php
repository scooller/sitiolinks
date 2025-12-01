<?php

namespace App\GraphQL\Mutations;

use App\Models\Tag;
use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class AssignUserTagsMutation extends Mutation
{
    protected $attributes = [
        'name' => 'assignUserTags',
        'description' => 'Asigna tags a un usuario. Usuarios no admin no pueden quitar/agregar tags fijos.',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'tag_ids' => [
                'type' => Type::nonNull(Type::listOf(Type::id())),
                'description' => 'Lista completa de tags a dejar asignados al usuario (reemplaza)',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $auth = Auth::user();
        if (! $auth) {
            throw new \Exception('No autenticado');
        }

        $targetUser = User::findOrFail($args['user_id']);
        $isAdmin = Gate::allows('Update:User');
        if (! $isAdmin && $auth->id !== $targetUser->id) {
            throw new \Exception('No autorizado');
        }

        $requested = collect($args['tag_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();

        if ($isAdmin) {
            $final = $requested;
        } else {
            $fixedIds = Tag::where('is_fixed', true)->pluck('id');
            $currentFixed = $targetUser->tags()->whereIn('tags.id', $fixedIds)->pluck('tags.id');
            $onlySelectable = $requested->diff($fixedIds);
            $final = $onlySelectable->merge($currentFixed)->unique()->values();
        }

        $targetUser->tags()->sync($final->all());

        return $targetUser->load(['tags', 'links']);
    }
}
