<div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
    <p>El creador puede usar este enlace para entrar sin contraseña por primera vez y definir su contraseña definitiva.</p>
    
    <div class="flex items-center space-x-2">
        <input type="text" readonly value="{{ $url }}" class="w-full text-xs p-2.5 rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-mono select-all">
    </div>

    <div class="text-xs text-gray-500">
        Válido por 72 horas. Se invalida automáticamente tras el primer inicio de sesión exitoso.
    </div>
</div>
