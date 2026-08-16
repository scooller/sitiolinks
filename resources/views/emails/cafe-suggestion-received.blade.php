<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nueva Sugerencia de Café</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0d6efd;">☕ Nueva Sugerencia de Café</h2>
    <p>Se ha recibido una nueva sugerencia que espera aprobación:</p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; width: 30%;">Nombre</td>
            <td style="padding: 8px;">{{ $suggestion->name }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Ciudad</td>
            <td style="padding: 8px;">{{ $suggestion->city ?? '—' }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Dirección</td>
            <td style="padding: 8px;">{{ $suggestion->address ?? '—' }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Website</td>
            <td style="padding: 8px;">{{ $suggestion->website ?? '—' }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Google Maps</td>
            <td style="padding: 8px;">{{ $suggestion->google_maps_url ?? '—' }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Notas</td>
            <td style="padding: 8px; white-space: pre-wrap;">{{ $suggestion->notes ?? '—' }}</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Sugerido por</td>
            <td style="padding: 8px;">{{ $suggestion->user?->name ?? 'Usuario anónimo' }} ({{ $suggestion->user?->email ?? '—' }})</td>
        </tr>
        <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold;">Fecha</td>
            <td style="padding: 8px;">{{ $suggestion->created_at->format('d/m/Y H:i:s') }}</td>
        </tr>
    </table>

    <p style="margin-top: 20px;">
        <a href="{{ url('/admin/cafe-suggestions') }}"
           style="background: #0d6efd; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Revisar Sugerencia
        </a>
    </p>

    <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
        Este es un email automático. Las sugerencias no aparecen en el sitio hasta ser aprobadas.
    </p>
</body>
</html>
