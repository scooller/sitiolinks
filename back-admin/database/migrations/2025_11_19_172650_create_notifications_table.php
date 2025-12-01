<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type', 50); // follow, gallery_featured, gallery_approved, system
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // datos adicionales contextuales
            $table->string('url')->nullable(); // link opcional
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Índices para consultas eficientes
            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
