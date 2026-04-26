<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\TicketComment;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class TicketCommentType extends GraphQLType
{
    protected $attributes = [
        'name' => 'TicketComment',
        'description' => 'Comentario de un ticket de soporte',
        'model' => TicketComment::class,
    ];

    public function fields(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
            'ticket_id' => ['type' => Type::nonNull(Type::int())],
            'user_id' => ['type' => Type::nonNull(Type::int())],
            'comment' => ['type' => Type::nonNull(Type::string())],
            'is_internal' => ['type' => Type::nonNull(Type::boolean())],
            'created_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->created_at ? $root->created_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario que escribió el comentario',
            ],
        ];
    }
}
