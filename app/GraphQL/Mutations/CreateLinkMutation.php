<?php

namespace App\GraphQL\Mutations;

use App\Models\Link;
use App\Models\User;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class CreateLinkMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createLink',
        'description' => 'Crea un link para un usuario (admin o el mismo usuario)',
    ];

    public function type(): Type
    {
        return GraphQL::type('Link');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
            ],
            'url' => [
                'type' => Type::nonNull(Type::string()),
            ],
            'icon' => [
                'type' => Type::string(),
            ],
            'order' => [
                'type' => Type::int(),
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $auth = Auth::user();
        if (! $auth) {
            throw new UserError('No autenticado');
        }

        $targetUser = User::findOrFail($args['user_id']);
        $isAdmin = Gate::allows('Update:User');
        if (! $isAdmin && $auth->id !== $targetUser->id) {
            throw new UserError('No autorizado');
        }

        $order = $args['order'] ?? null;
        if ($order === null) {
            $max = Link::where('user_id', $targetUser->id)->max('order');
            $order = ($max === null ? 0 : ((int) $max) + 1);
        }

        $link = Link::create([
            'user_id' => $targetUser->id,
            'name' => $args['name'],
            'url' => $args['url'],
            'icon' => $args['icon'] ?? 'fas-link',
            'order' => (int) $order,
        ]);

        return $link;
    }
}
