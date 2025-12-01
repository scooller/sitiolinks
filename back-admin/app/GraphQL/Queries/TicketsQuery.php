<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Ticket;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class TicketsQuery extends Query
{
    protected $attributes = [
        'name' => 'tickets',
        'description' => 'Lista de tickets con filtros opcionales',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Ticket'));
    }

    public function args(): array
    {
        return [
            'user_id' => ['type' => Type::int()],
            'status' => ['type' => Type::string()],
            'priority' => ['type' => Type::string()],
            'category' => ['type' => Type::string()],
            'limit' => ['type' => Type::int(), 'defaultValue' => 20],
        ];
    }

    public function resolve($root, $args)
    {
        $query = Ticket::query()->withCount('comments')->with(['user', 'assignedTo']);

        if (! empty($args['user_id'])) {
            $query->where('user_id', $args['user_id']);
        }
        if (! empty($args['status'])) {
            $query->where('status', $args['status']);
        }
        if (! empty($args['priority'])) {
            $query->where('priority', $args['priority']);
        }
        if (! empty($args['category'])) {
            $query->where('category', $args['category']);
        }

        $limit = (int) ($args['limit'] ?? 20);
        $limit = max(1, min(100, $limit));

        return $query->latest()->limit($limit)->get();
    }
}
