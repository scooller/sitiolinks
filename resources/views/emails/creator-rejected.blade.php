<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Perfil rechazado</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2>Hola, {{ $managerName }}</h2>
    <p>El perfil de <strong>{{ $creatorName }} (@{{ $creatorUsername }})</strong> ha sido <strong>rechazado</strong> por el equipo de administración.</p>
    <p><strong>Motivo:</strong> {{ $reason }}</p>
    <p>Puedes corregir los datos o documentos e intentarlo nuevamente desde tu panel de manager.</p>
    <p style="color:#666;font-size:12px;margin-top:30px">Si tienes dudas, contacta con soporte.</p>
</body>
</html>
