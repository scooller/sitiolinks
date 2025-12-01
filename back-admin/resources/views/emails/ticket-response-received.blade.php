<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nueva Respuesta en tu Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #0d6efd;">💬 Nueva Respuesta en tu Ticket</h2>
        
        <p>Hola <strong>{{ $ticket->user->name }}</strong>,</p>
        
        <p>Has recibido una nueva respuesta en tu ticket de soporte:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold; width: 30%;">Ticket #</td>
                <td style="padding: 8px;">{{ $ticket->id }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Asunto</td>
                <td style="padding: 8px;">{{ $ticket->subject }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Respondido por</td>
                <td style="padding: 8px;">{{ $comment->user->name }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Fecha</td>
                <td style="padding: 8px;">{{ $comment->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
        
        <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #0d6efd; border-radius: 5px; margin: 20px 0;">
            <strong>Respuesta:</strong><br>
            <p style="white-space: pre-wrap; margin-top: 10px;">{{ $comment->comment }}</p>
        </div>
        
        <p style="margin-top: 30px;">
            <a href="{{ url('/tickets/' . $ticket->id) }}" 
               style="display: inline-block; padding: 12px 24px; background: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">
                Ver Ticket Completo
            </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #6c757d;">
            Este es un email automático del sistema de soporte. Si deseas responder, accede al ticket desde tu cuenta.
        </p>
    </div>
</body>
</html>
