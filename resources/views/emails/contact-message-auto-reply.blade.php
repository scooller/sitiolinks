<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mensaje recibido</title>
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
            text-align: center;
        }
        .content {
            background-color: #fff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 0.9em;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>✅ Mensaje recibido</h2>
    </div>

    <div class="content">
        <p>Hola <strong>{{ $contactMessage->name }}</strong>,</p>
        
        <p>Hemos recibido tu mensaje y te agradecemos por contactarnos. Nuestro equipo revisará tu consulta y te responderemos a la brevedad posible.</p>
        
        <p><strong>Resumen de tu mensaje:</strong></p>
        <ul>
            <li><strong>Asunto:</strong> {{ $contactMessage->subject }}</li>
            <li><strong>Fecha:</strong> {{ $contactMessage->created_at->format('d/m/Y H:i:s') }}</li>
        </ul>

        <p>Si tu consulta es urgente o no recibes respuesta en las próximas 48 horas, no dudes en contactarnos nuevamente.</p>
        
        <p>Saludos,<br>
        <strong>El equipo de {{ config('app.name') }}</strong></p>
    </div>

    <div class="footer">
        <p><small>Este es un mensaje automático. Por favor, no respondas directamente a este correo.</small></p>
    </div>
</body>
</html>
