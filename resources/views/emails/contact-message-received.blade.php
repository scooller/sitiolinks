<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo mensaje de contacto</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #fff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }
        .field {
            margin-bottom: 15px;
        }
        .field-label {
            font-weight: bold;
            color: #495057;
        }
        .field-value {
            margin-top: 5px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 3px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 0.9em;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>📧 Nuevo mensaje de contacto</h2>
        <p>Has recibido un nuevo mensaje desde el formulario de contacto.</p>
    </div>

    <div class="content">
        <div class="field">
            <div class="field-label">Nombre:</div>
            <div class="field-value">{{ $contactMessage->name }}</div>
        </div>

        <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value">
                <a href="mailto:{{ $contactMessage->email }}">{{ $contactMessage->email }}</a>
            </div>
        </div>

        <div class="field">
            <div class="field-label">Asunto:</div>
            <div class="field-value">{{ $contactMessage->subject }}</div>
        </div>

        <div class="field">
            <div class="field-label">Mensaje:</div>
            <div class="field-value">{{ nl2br(e($contactMessage->message)) }}</div>
        </div>

        <div class="field">
            <div class="field-label">Enviado:</div>
            <div class="field-value">{{ $contactMessage->created_at->format('d/m/Y H:i:s') }}</div>
        </div>

        @if($contactMessage->user_id)
        <div class="field">
            <div class="field-label">Usuario registrado:</div>
            <div class="field-value">ID: {{ $contactMessage->user_id }}</div>
        </div>
        @endif

        <div class="field">
            <div class="field-label">IP:</div>
            <div class="field-value">{{ $contactMessage->ip_address }}</div>
        </div>
    </div>

    <div class="footer">
        <p>Puedes responder a este mensaje desde el panel de administración.</p>
        <p><small>Este es un mensaje automático del sistema de contacto.</small></p>
    </div>
</body>
</html>
