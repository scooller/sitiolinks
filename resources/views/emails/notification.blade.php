<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva notificación</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px 0; }
        .notification { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .button-secondary { background-color: #ffc107; color: #111; }
    </style>
</head>
<body>
    @php
        $frontendBase = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $notificationsUrl = $frontendBase.'/notificaciones';
        $vipNotificationsUrl = $notificationsUrl.'?'.http_build_query(['filter' => 'vip']);
        $replyToId = data_get($notification->data, 'sender_id');
        $replyToUsername = data_get($notification->data, 'sender_username');
    @endphp
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
            <p>Tienes una nueva notificación</p>
        </div>

        <div class="content">
            <p>Hola <strong>{{ $user->username }}</strong>,</p>

            <p>Has recibido una nueva notificación en tu cuenta:</p>

            <div class="notification">
                <h3>{{ $notification->title }}</h3>
                <p>{{ $notification->message }}</p>
                <p><small>Fecha: {{ $notification->created_at->format('d/m/Y H:i') }}</small></p>
            </div>

            <p>
                <a href="{{ $vipNotificationsUrl }}" class="button">Ver todas las notificaciones</a>
            </p>

            @if($notification->type === 'vip_user_message' && !empty($replyToId))
                <p>
                    <a
                        href="{{ $notificationsUrl.'?'.http_build_query(['filter' => 'vip', 'reply_to' => $replyToId, 'reply_username' => $replyToUsername]) }}"
                        class="button button-secondary"
                    >
                        Responder
                    </a>
                </p>
            @endif

            <p>Si no deseas recibir estos emails, puedes desactivar las notificaciones por email en tu perfil.</p>
        </div>

        <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>{{ config('app.name') }} - {{ date('Y') }}</p>
        </div>
    </div>
</body>
</html>
