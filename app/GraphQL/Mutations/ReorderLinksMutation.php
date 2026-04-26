<?php

namespace App\GraphQL\Mutations;

use App\Models\Link;
use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class ReorderLinksMutation extends Mutation
{
    protected $attributes = [
        'name' => 'reorderLinks',
        'description' => 'Reordena los links de un usuario según el arreglo de IDs',
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
            'ids' => [
                'type' => Type::nonNull(Type::listOf(Type::id())),
                'description' => 'IDs de links en el nuevo orden (primer elemento tendrá order=0)',
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

        $ids = array_values($args['ids'] ?? []);
        foreach ($ids as $index => $id) {
            $link = Link::where('id', $id)->where('user_id', $targetUser->id)->first();
            if ($link) {
                $link->order = $index;
                $link->save();
            }
        }

        return $targetUser->load(['links' => function ($q) {
            $q->orderBy('order');
        }, 'tags']);
    }
}
