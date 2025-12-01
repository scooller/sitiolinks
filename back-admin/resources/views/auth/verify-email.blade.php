<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificar Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✉️</div>
        <h1>Verifica tu Correo Electrónico</h1>
        <p>
            Hemos enviado un enlace de verificación a tu correo electrónico.
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
        </p>
        <p>
            Si no recibiste el email, puedes solicitar uno nuevo desde tu perfil.
        </p>
        <a href="{{ config('app.frontend_url') }}/verify-email" class="button">
            Ir a la aplicación
        </a>
    </div>
</body>
</html>
