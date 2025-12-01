<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Mail\TicketResponseReceived;
use App\Models\Ticket;
use App\Models\TicketComment;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class AddTicketCommentMutation extends Mutation
{
    protected $attributes = [
        'name' => 'addTicketComment',
        'description' => 'Agrega un comentario a un ticket',
    ];

    public function type(): Type
    {
        return GraphQL::type('TicketComment');
    }

    public function args(): array
    {
        return [
            'ticket_id' => ['type' => Type::nonNull(Type::int())],
            'comment' => ['type' => Type::nonNull(Type::string())],
            'is_internal' => ['type' => Type::boolean(), 'defaultValue' => false],
        ];
    }

    public function rules(array $args = []): array
    {
        return [
            'ticket_id' => ['required', 'integer', 'exists:tickets,id'],
            'comment' => ['required', 'string', 'min:2'],
        ];
    }

    public function resolve($root, $args)
    {
        Log::info('GraphQL addTicketComment auth debug: entering', [
            'auth_check' => Auth::check(),
            'default_guard' => config('auth.defaults.guard'),
            'session_id' => session()->getId(),
            'cookies' => request()->cookies->all(),
            'headers_origin' => request()->headers->get('origin'),
            'headers_referer' => request()->headers->get('referer'),
        ]);

        $user = Auth::guard(config('auth.defaults.guard'))->user()
            ?? Auth::guard('web')->user()
            ?? Auth::user()
            ?? request()->user();
        if (! $user) {
            Log::warning('GraphQL addTicketComment: unauthenticated', [
                'auth_check' => Auth::check(),
                'session_id' => session()->getId(),
            ]);
            throw new \Rebing\GraphQL\Error\AuthorizationError('Unauthenticated');
        }

        // Solo usuarios con email verificado pueden comentar tickets (excepto admins)
        $isAdmin = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['super_admin', 'admin', 'moderator'])
            ->exists();

        if (! $isAdmin && ! $user->email_verified_at) {
            throw new \Exception('Debes verificar tu correo electrónico para poder comentar en tickets.');
        }

        $ticket = Ticket::findOrFail($args['ticket_id']);

        $isOwner = $ticket->user_id === $user->id;
        $isAssigned = $ticket->assigned_to && $ticket->assigned_to === $user->id;

        if (! ($isAdmin || $isOwner || $isAssigned)) {
            throw new \Exception('No tienes permisos para comentar este ticket.');
        }

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'comment' => $args['comment'],
            'is_internal' => (bool) ($args['is_internal'] ?? false),
        ]);

        // Marcar primera respuesta del staff
        if ($isAdmin && ! $ticket->first_response_at) {
            $ticket->first_response_at = now();
            $ticket->save();
        }

        // Notify ticket owner if admin commented and not internal
        if ($isAdmin && ! $comment->is_internal && $ticket->user && $ticket->user->email) {
            Mail::to($ticket->user->email)->send(new TicketResponseReceived($ticket->fresh(['user']), $comment->fresh(['user'])));
        }

        return $comment->fresh(['user']);
    }
}
