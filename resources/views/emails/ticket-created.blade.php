<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nuevo Ticket de Soporte</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #dc3545;">🔔 Nuevo Ticket de Soporte</h2>
        
        <p>Se ha creado un nuevo ticket en el sistema:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold; width: 30%;">Ticket #</td>
                <td style="padding: 8px;">{{ $ticket->id }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Usuario</td>
                <td style="padding: 8px;">{{ $ticket->user->name }} ({{ $ticket->user->email }})</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Asunto</td>
                <td style="padding: 8px;">{{ $ticket->subject }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Categoría</td>
                <td style="padding: 8px;">{{ ucfirst($ticket->category) }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Prioridad</td>
                <td style="padding: 8px;">{{ ucfirst($ticket->priority) }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Estado</td>
                <td style="padding: 8px;">{{ ucfirst($ticket->status) }}</td>
            </tr>
        </table>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Descripción:</strong><br>
            <p style="white-space: pre-wrap; margin-top: 10px;">{{ $ticket->description }}</p>
        </div>
        
        <p style="margin-top: 30px;">
            <a href="{{ url('/admin/tickets/' . $ticket->id . '/edit') }}" 
               style="display: inline-block; padding: 12px 24px; background: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">
                Ver Ticket en Admin
            </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #6c757d;">
            Este es un email automático del sistema de soporte. Por favor, no responder directamente a este correo.
        </p>
    </div>
</body>
</html>
