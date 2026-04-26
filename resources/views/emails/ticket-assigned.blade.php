<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket Asignado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #ffc107;">📋 Ticket Asignado a ti</h2>
        
        <p>Hola <strong>{{ $ticket->assignedTo->name }}</strong>,</p>
        
        <p>Se te ha asignado el siguiente ticket de soporte:</p>
        
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
                <td style="padding: 8px; 
                    @if($ticket->priority === 'urgente') color: #dc3545; font-weight: bold; 
                    @elseif($ticket->priority === 'alta') color: #ffc107; font-weight: bold; 
                    @endif">
                    {{ ucfirst($ticket->priority) }}
                </td>
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
               style="display: inline-block; padding: 12px 24px; background: #ffc107; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Atender Ticket
            </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #6c757d;">
            Este es un email automático del sistema de soporte.
        </p>
    </div>
</body>
</html>
