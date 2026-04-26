<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\ContactMessage;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ContactMessageType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ContactMessage',
        'description' => 'Mensaje de contacto enviado por usuarios',
        'model' => ContactMessage::class,
    ];

    public function fields(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
            'name' => ['type' => Type::nonNull(Type::string())],
            'email' => ['type' => Type::nonNull(Type::string())],
            'subject' => ['type' => Type::nonNull(Type::string())],
            'message' => ['type' => Type::nonNull(Type::string())],
            'status' => ['type' => Type::nonNull(Type::string())],
            'created_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->created_at ? $root->created_at->format('Y-m-d H:i:s') : null;
                },
            ],
        ];
    }
}
