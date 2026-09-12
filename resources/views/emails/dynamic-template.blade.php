<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $renderedSubject ?? config('app.name') }}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f4f5f7; padding: 32px 12px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
        .body-content { padding: 32px 28px; line-height: 1.7; font-size: 15px; color: #334155; }
        .body-content p { margin: 0 0 16px 0; }
        .body-content a { color: #0284c7; text-decoration: underline; }
        .body-content img { max-width: 100%; height: auto; border-radius: 8px; }
        .footer { padding: 24px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
        .footer p { margin: 4px 0; }
        .footer a { color: #64748b; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>{{ config('app.name', 'Link Persons') }}</h1>
                <p>Comunicación Oficial</p>
            </div>
            <div class="body-content">
                {!! $renderedContent !!}
            </div>
            <div class="footer">
                <p>Recibes este correo porque estás registrado en <strong>{{ config('app.name') }}</strong>.</p>
                @if(!empty($unsubscribeUrl))
                    <p><a href="{{ $unsubscribeUrl }}">Gestionar preferencias de notificaciones</a></p>
                @endif
                <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>
