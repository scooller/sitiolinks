<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;

class DeleteProfileMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteProfile',
        'description' => 'Eliminar definitivamente el perfil del usuario autenticado',
    ];

    public function type(): Type
    {
        return Type::boolean();
    }

    public function args(): array
    {
        return [
            'email' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Email del perfil a eliminar (confirmación)',
            ],
        ];
    }

    public function resolve($root, array $args): bool
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        if (strcasecmp($user->email, $args['email']) !== 0) {
            throw new UserError('El email no coincide con el perfil');
        }

        $user->delete();

        auth('web')->logout();
        if (session()->isStarted()) {
            session()->invalidate();
            session()->regenerateToken();
        }

        return true;
    }
}
