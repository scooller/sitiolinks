<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Mail\TicketAssigned;
use App\Models\Ticket;
use App\Models\User;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UpdateTicketMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateTicket',
        'description' => 'Actualiza campos administrativos del ticket',
    ];

    public function type(): Type
    {
        return GraphQL::type('Ticket');
    }

    public function args(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::int())],
            'status' => ['type' => Type::string()],
            'assigned_to' => ['type' => Type::int()],
            'resolution' => ['type' => Type::string()],
        ];
    }

    public function resolve($root, $args)
    {
        $user = auth('web')->user();
        if (! $user) {
            throw new \Exception('Unauthenticated.');
        }
        $isAdmin = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['super_admin', 'admin', 'moderator'])
            ->exists();
        if (! $isAdmin) {
            throw new \Exception('No autorizado.');
        }

        $validator = Validator::make($args, [
            'id' => ['required', 'integer', 'exists:tickets,id'],
            'status' => ['nullable', 'in:abierto,en_progreso,resuelto,cerrado,reabierto'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'resolution' => ['nullable', 'string', 'min:3'],
        ]);
        $validator->validate();

        // Validar que assigned_to sea admin/moderador
        if (array_key_exists('assigned_to', $args) && $args['assigned_to']) {
            $isAssigneeAdmin = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $args['assigned_to'])
                ->whereIn('roles.name', ['super_admin', 'admin', 'moderator'])
                ->exists();

            if (! $isAssigneeAdmin) {
                throw new \Exception('Solo se puede asignar tickets a administradores o moderadores.');
            }
        }

        $ticket = Ticket::findOrFail($args['id']);

        $oldAssignedTo = $ticket->assigned_to;

        if (array_key_exists('assigned_to', $args)) {
            $ticket->assigned_to = $args['assigned_to'];
        }
        if (! empty($args['status'])) {
            $prev = $ticket->status;
            $ticket->status = $args['status'];
            if ($args['status'] === Ticket::STATUS_RESOLVED && ! $ticket->resolved_at) {
                $ticket->resolved_at = now();
            }
            if ($args['status'] === Ticket::STATUS_CLOSED && ! $ticket->closed_at) {
                $ticket->closed_at = now();
            }
            if ($args['status'] === Ticket::STATUS_IN_PROGRESS && $prev === Ticket::STATUS_OPEN && ! $ticket->first_response_at) {
                $ticket->first_response_at = now();
            }
        }
        if (array_key_exists('resolution', $args)) {
            $ticket->resolution = $args['resolution'];
        }

        $ticket->save();

        // Notify newly assigned admin
        if (array_key_exists('assigned_to', $args) && $args['assigned_to'] !== $oldAssignedTo && $args['assigned_to']) {
            $assignedUser = User::find($args['assigned_to']);
            if ($assignedUser && $assignedUser->email) {
                Mail::to($assignedUser->email)->send(new TicketAssigned($ticket->fresh(['user', 'assignedTo'])));
            }
        }

        return $ticket->fresh(['user', 'assignedTo']);
    }
}
