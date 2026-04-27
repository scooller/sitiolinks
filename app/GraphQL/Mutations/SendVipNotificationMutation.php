<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use App\Services\NotificationService;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class SendVipNotificationMutation extends Mutation
{
    protected $attributes = [
        'name' => 'sendVipNotification',
        'description' => 'Enviar un mensaje/notificacion a un usuario VIP',
    ];

    public function type(): Type
    {
        return GraphQL::type('Notification');
    }

    public function args(): array
    {
        return [
            'recipient_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del usuario destinatario VIP',
            ],
            'message' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Mensaje para el creador VIP',
            ],
            'title' => [
                'type' => Type::string(),
                'description' => 'Titulo opcional',
            ],
            'url' => [
                'type' => Type::string(),
                'description' => 'URL opcional para abrir desde la notificacion',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $authenticatedUser = auth('web')->user();

        if (! $authenticatedUser) {
            throw new UserError('Debes estar autenticado para enviar mensajes VIP.');
        }

        if (! $authenticatedUser instanceof User) {
            throw new UserError('No se pudo resolver el usuario autenticado.');
        }

        $sender = $authenticatedUser;

        $recipient = User::findOrFail((int) $args['recipient_id']);

        $senderIsVip = $sender->hasRole('vip');

        if (! $senderIsVip && ! $recipient->hasRole('vip')) {
            throw new UserError('Solo puedes enviar mensajes a usuarios VIP.');
        }

        if ($recipient->id === $sender->id) {
            throw new UserError('No puedes enviarte un mensaje VIP a ti mismo.');
        }

        $message = trim((string) $args['message']);

        if ($message === '') {
            throw new UserError('El mensaje no puede estar vacio.');
        }

        return NotificationService::notifyVipUserMessage(
            recipient: $recipient,
            sender: $sender,
            message: $message,
            title: isset($args['title']) ? trim((string) $args['title']) : null,
            url: isset($args['url']) ? trim((string) $args['url']) : null,
        );
    }
}
