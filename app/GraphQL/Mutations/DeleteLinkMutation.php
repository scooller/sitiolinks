<?php

namespace App\GraphQL\Mutations;

use App\Models\Link;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Rebing\GraphQL\Support\Mutation;

class DeleteLinkMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteLink',
        'description' => 'Elimina un link (admin o propietario)',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::boolean());
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $auth = Auth::user();
        if (! $auth) {
            throw new \Exception('No autenticado');
        }

        $link = Link::findOrFail($args['id']);
        $isAdmin = Gate::allows('Update:User');
        if (! $isAdmin && $auth->id !== $link->user_id) {
            throw new \Exception('No autorizado');
        }

        $link->delete();

        return true;
    }
}
