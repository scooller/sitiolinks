<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Permitir creadores sin email propio (login via magic-link o teléfono)
            $table->string('email')->nullable()->change();
            // Token de magic-link para primer login del creador (sin email propio)
            $table->string('magic_link_token', 64)->nullable()->unique()->after('remember_token');
            $table->timestamp('magic_link_expires_at')->nullable()->after('magic_link_token');
            // Teléfono opcional (login alternativo futuro)
            $table->string('phone', 30)->nullable()->after('magic_link_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['magic_link_token', 'magic_link_expires_at', 'phone']);
        });
    }
};
