<?php

namespace App\GraphQL\Mutations;

use App\Models\Link;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UpdateLinkMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateLink',
        'description' => 'Actualiza un link existente (admin o propietario)',
    ];

    public function type(): Type
    {
        return GraphQL::type('Link');
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::string(),
            ],
            'url' => [
                'type' => Type::string(),
            ],
            'icon' => [
                'type' => Type::string(),
            ],
            'is_adult' => [
                'type' => Type::boolean(),
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

        $link = Link::findOrFail($args['id']);
        $isAdmin = Gate::allows('Update:User');
        if (! $isAdmin && $auth->id !== $link->user_id) {
            throw new UserError('No autorizado');
        }

        $update = [];
        foreach (['name', 'url', 'icon', 'is_adult', 'order'] as $field) {
            if (array_key_exists($field, $args) && $args[$field] !== null) {
                $update[$field] = match ($field) {
                    'order' => (int) $args[$field],
                    'is_adult' => (bool) $args[$field],
                    default => $args[$field],
                };
            }
        }

        if (! empty($update)) {
            $link->update($update);
        }

        return $link->refresh();
    }
}
