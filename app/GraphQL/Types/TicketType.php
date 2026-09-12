<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\Ticket;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class TicketType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Ticket',
        'description' => 'Ticket de soporte',
        'model' => Ticket::class,
    ];

    public function fields(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
            'user_id' => ['type' => Type::nonNull(Type::int())],
            'assigned_to' => ['type' => Type::int()],
            'category' => ['type' => Type::nonNull(Type::string())],
            'priority' => ['type' => Type::nonNull(Type::string())],
            'status' => ['type' => Type::nonNull(Type::string())],
            'subject' => ['type' => Type::nonNull(Type::string())],
            'description' => ['type' => Type::nonNull(Type::string())],
            'resolution' => ['type' => Type::string()],
            'first_response_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->first_response_at ? $root->first_response_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'resolved_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->resolved_at ? $root->resolved_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'closed_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->closed_at ? $root->closed_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'created_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->created_at ? $root->created_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'updated_at' => [
                'type' => Type::string(),
                'resolve' => function ($root) {
                    return $root->updated_at ? $root->updated_at->format('Y-m-d H:i:s') : null;
                },
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario que creó el ticket',
            ],
            'assigned_user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario asignado al ticket',
                'resolve' => function ($root) {
                    return $root->assignedTo;
                },
            ],
            'comments' => [
                'type' => Type::listOf(GraphQL::type('TicketComment')),
                'description' => 'Comentarios del ticket',
                'resolve' => function ($root) {
                    $viewer = auth('web')->user() ?? auth('sanctum')->user();
                    $isAdmin = $viewer && $viewer->hasAnyRole(['super_admin', 'admin', 'moderator']);
                    if ($isAdmin) {
                        return $root->comments;
                    }

                    return $root->comments ? $root->comments->where('is_internal', false)->values() : collect();
                },
            ],
            'comments_count' => [
                'type' => Type::int(),
                'description' => 'Número de comentarios',
                'resolve' => function ($root) {
                    $viewer = auth('web')->user() ?? auth('sanctum')->user();
                    $isAdmin = $viewer && $viewer->hasAnyRole(['super_admin', 'admin', 'moderator']);
                    if ($isAdmin) {
                        return $root->comments()->count();
                    }

                    return $root->comments()->where('is_internal', false)->count();
                },
            ],
        ];
    }
}
