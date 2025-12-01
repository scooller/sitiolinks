<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

// Obtener primer usuario
$user = User::first();

if ($user) {
    echo "Usuario: {$user->username}\n";
    echo 'Verificado antes: '.($user->is_verified ? 'SI' : 'NO')."\n";

    // Marcar como verificado
    $user->is_verified = true;
    $user->verified_at = now();
    $user->save();

    echo 'Verificado después: '.($user->is_verified ? 'SI' : 'NO')."\n";
    echo "Fecha verificación: {$user->verified_at}\n";
} else {
    echo "No hay usuarios\n";
}
