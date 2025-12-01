<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Link;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UpdateLinksMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateLinks',
        'description' => 'Actualizar links personalizados del usuario autenticado',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'links' => [
                'type' => Type::listOf(GraphQL::type('LinkInput')),
                'description' => 'Array de links a crear/actualizar',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $currentUser = auth('web')->user();

        if (! $currentUser) {
            throw new \Exception('Debes estar autenticado para actualizar tus links.');
        }

        // Solo permitir a creadores gestionar links
        if (! $currentUser->hasRole('creator')) {
            throw new \Exception('Solo los creadores pueden gestionar links personalizados.');
        }

        // Eliminar todos los links existentes del usuario
        $currentUser->links()->delete();

        // Crear los nuevos links
        if (isset($args['links']) && is_array($args['links'])) {
            foreach ($args['links'] as $index => $linkData) {
                Link::create([
                    'user_id' => $currentUser->id,
                    'name' => $linkData['name'] ?? '',
                    'url' => $linkData['url'] ?? '',
                    'icon' => $linkData['icon'] ?? 'fas-link',
                    'order' => $index,
                ]);
            }
        }

        return $currentUser->fresh(['tags', 'links', 'roles']);
    }
}
