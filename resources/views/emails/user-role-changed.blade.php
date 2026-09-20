<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Tipo de Cuenta</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            width: 100%;
            background-color: #f1f5f9;
            padding: 30px 15px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
            padding: 28px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 6px 0 0;
            font-size: 14px;
            color: #a1a1aa;
        }
        .content {
            padding: 28px 24px;
        }
        .badge-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .role-badge {
            display: inline-block;
            padding: 8px 18px;
            font-size: 16px;
            font-weight: 700;
            border-radius: 9999px;
            margin-top: 8px;
            letter-spacing: 0.3px;
        }
        .role-vip {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #78350f;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
        }
        .role-creator {
            background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(219, 39, 119, 0.25);
        }
        .role-admin, .role-super_admin {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
        }
        .role-moderator {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: #ffffff;
        }
        .role-user {
            background: #e2e8f0;
            color: #334155;
        }
        .perks {
            background-color: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 14px 16px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .perks ul {
            margin: 8px 0 0;
            padding-left: 20px;
        }
        .perks li {
            margin-bottom: 6px;
        }
        .button-wrap {
            text-align: center;
            margin: 28px 0 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 28px;
            background: #18181b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            transition: background 0.2s;
        }
        .footer {
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
            padding: 16px 24px 24px;
            border-top: 1px solid #f1f5f9;
        }
    </style>
</head>
<body>
    @php
        $frontendBase = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $profileUrl = $frontendBase . ($user->username ? '/u/' . $user->username : '');
        $badgeClass = match($newRole) {
            'vip' => 'role-vip',
            'creator' => 'role-creator',
            'admin', 'super_admin' => 'role-admin',
            'moderator' => 'role-moderator',
            default => 'role-user',
        };
    @endphp
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>{{ config('app.name') }}</h1>
                <p>Novedades sobre tu cuenta</p>
            </div>

            <div class="content">
                <p>Hola <strong>{{ $user->name ?: $user->username }}</strong> (@{{ $user->username }}),</p>

                <p>Te informamos que tu tipo de cuenta ha sido actualizado por el equipo de administración.</p>

                <div class="badge-card">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Tu nuevo nivel de usuario es:</div>
                    <span class="role-badge {{ $badgeClass }}">{{ $newRoleLabel }}</span>
                    @if(!empty($oldRoleLabel) && $oldRoleLabel !== $newRoleLabel)
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Anteriormente: {{ $oldRoleLabel }}</div>
                    @endif
                </div>

                @if($newRole === 'vip')
                    <div class="perks">
                        <strong>Beneficios de tu membresía VIP:</strong>
                        <ul>
                            <li>Acceso completo a galerías y álbumes fotográficos VIP exclusivos.</li>
                            <li>Mensajería VIP prioritaria con tus creadores favoritos.</li>
                            <li>Distintivo VIP visible en la plataforma.</li>
                        </ul>
                    </div>
                @elseif($newRole === 'creator')
                    <div class="perks">
                        <strong>Beneficios de tu cuenta de Creador/a:</strong>
                        <ul>
                            <li>Publicación y gestión de galerías públicas y privadas.</li>
                            <li>Aparición destacada en el directorio de creadores y modelos.</li>
                            <li>Personalización de enlaces sociales, tarifas y tarjeta de presentación.</li>
                        </ul>
                    </div>
                @elseif(in_array($newRole, ['admin', 'super_admin', 'moderator']))
                    <div class="perks">
                        <strong>Acceso Administrativo:</strong>
                        <ul>
                            <li>Tienes permisos asignados para el panel de gestión y soporte.</li>
                        </ul>
                    </div>
                @endif

                <p>Puedes ingresar a tu perfil o explorar la plataforma para aprovechar tus nuevas funciones:</p>

                <div class="button-wrap">
                    <a href="{{ $profileUrl }}" class="button" target="_blank">Ir a mi Perfil</a>
                </div>
            </div>

            <div class="footer">
                <p>Este es un correo automático generado por el sistema de {{ config('app.name') }}.</p>
                <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>
