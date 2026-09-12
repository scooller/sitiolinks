<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Ticket;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class TicketQuery extends Query
{
    protected $attributes = [
        'name' => 'ticket',
        'description' => 'Obtiene un ticket por ID',
    ];

    public function type(): Type
    {
        return GraphQL::type('Ticket');
    }

    public function args(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
        ];
    }

    public function resolve($root, $args)
    {
        $viewer = auth('web')->user() ?? auth('sanctum')->user();
        if (! $viewer) {
            return null;
        }

        $ticket = Ticket::with(['user', 'assignedTo', 'comments.user'])->find($args['id']);
        if (! $ticket) {
            return null;
        }

        $isAdmin = $viewer->hasAnyRole(['super_admin', 'admin', 'moderator']);
        $isOwner = (int) $ticket->user_id === (int) $viewer->id;
        $isAssigned = $ticket->assigned_to && (int) $ticket->assigned_to === (int) $viewer->id;

        if (! ($isAdmin || $isOwner || $isAssigned)) {
            return null;
        }

        return $ticket;
    }
}
