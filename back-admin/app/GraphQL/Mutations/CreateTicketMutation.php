<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Mail\TicketCreated;
use App\Models\Ticket;
use App\Models\User;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class CreateTicketMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createTicket',
        'description' => 'Crea un ticket de soporte',
    ];

    public function type(): Type
    {
        return GraphQL::type('Ticket');
    }

    public function args(): array
    {
        return [
            'user_id' => ['type' => Type::nonNull(Type::int())],
            'subject' => ['type' => Type::nonNull(Type::string())],
            'description' => ['type' => Type::nonNull(Type::string())],
            'category' => ['type' => Type::nonNull(Type::string())],
            'priority' => ['type' => Type::nonNull(Type::string())],
        ];
    }

    public function resolve($root, $args)
    {
        $validator = Validator::make($args, [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'subject' => ['required', 'string', 'min:3', 'max:190'],
            'description' => ['required', 'string', 'min:10'],
            'category' => ['required', 'in:tecnico,facturacion,cuenta,contenido,otro'],
            'priority' => ['required', 'in:baja,media,alta,urgente'],
        ]);
        $validator->validate();

        $user = User::findOrFail($args['user_id']);

        // Solo usuarios con email verificado pueden crear tickets
        if (! $user->email_verified_at) {
            throw new \Exception('Debes verificar tu correo electrónico para poder crear tickets de soporte.');
        }

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => $args['subject'],
            'description' => $args['description'],
            'category' => $args['category'],
            'priority' => $args['priority'],
            'status' => Ticket::STATUS_OPEN,
        ]);

        // Notify admins and moderators
        $admins = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['super_admin', 'admin', 'moderator']);
        })->get();

        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new TicketCreated($ticket->fresh(['user'])));
        }

        return $ticket->fresh(['user', 'assignedTo']);
    }
}
