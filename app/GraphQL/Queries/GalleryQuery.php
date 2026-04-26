<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Gallery;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class GalleryQuery extends Query
{
    protected $attributes = [
        'name' => 'gallery',
        'description' => 'Obtener una galería por ID',
    ];

    public function type(): Type
    {
        return GraphQL::type('Gallery');
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID de la galería',
            ],
        ];
    }

    public function resolve($root, $args)
    {
        $gallery = Gallery::with(['user', 'media'])->findOrFail($args['id']);

        $user = auth('web')->user();

        if (! $gallery->isVisibleTo($user)) {
            throw new \Exception('No tienes permiso para ver esta galería.');
        }

        return $gallery;
    }
}
