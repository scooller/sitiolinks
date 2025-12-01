<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class GalleryMediaItemType extends GraphQLType
{
    protected $attributes = [
        'name' => 'GalleryMediaItem',
        'description' => 'Item de media en una galería con información de orden y caption',
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ID del media',
            ],
            'name' => [
                'type' => Type::string(),
                'description' => 'Nombre del archivo',
            ],
            'file_name' => [
                'type' => Type::string(),
                'description' => 'Nombre del archivo original',
            ],
            'mime_type' => [
                'type' => Type::string(),
                'description' => 'Tipo MIME',
            ],
            'size' => [
                'type' => Type::int(),
                'description' => 'Tamaño en bytes',
            ],
            'order' => [
                'type' => Type::int(),
                'description' => 'Orden en la galería',
                'resolve' => function ($root) {
                    return $root->pivot->order ?? 0;
                },
            ],
            'caption' => [
                'type' => Type::string(),
                'description' => 'Caption del media en la galería',
                'resolve' => function ($root) {
                    return $root->pivot->caption ?? null;
                },
            ],
            'url' => [
                'type' => Type::string(),
                'description' => 'URL del archivo original',
                'resolve' => function ($root) {
                    return route('gallery.media', ['media' => $root->id]);
                },
            ],
            'thumb_url' => [
                'type' => Type::string(),
                'description' => 'URL del thumbnail',
                'resolve' => function ($root) {
                    return route('gallery.media.conversion', ['media' => $root->id, 'conversion' => 'thumb']);
                },
            ],
            'thumb_webp_url' => [
                'type' => Type::string(),
                'description' => 'URL del thumbnail en formato WebP',
                'resolve' => function ($root) {
                    return route('gallery.media.conversion', ['media' => $root->id, 'conversion' => 'thumb_webp']);
                },
            ],
            'preview_url' => [
                'type' => Type::string(),
                'description' => 'URL de la vista previa',
                'resolve' => function ($root) {
                    return route('gallery.media.conversion', ['media' => $root->id, 'conversion' => 'preview']);
                },
            ],
        ];
    }
}
