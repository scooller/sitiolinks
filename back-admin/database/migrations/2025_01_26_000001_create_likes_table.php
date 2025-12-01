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
        if (! Schema::hasTable('likes')) {
            Schema::create('likes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('gallery_id');
                $table->timestamps();
                $table->unique(['user_id', 'gallery_id']);
                $table->index('gallery_id');
                $table->index('user_id');
                $table->index('created_at');
            });
        }

        if (Schema::hasTable('users') && Schema::hasTable('galleries')) {
            try {
                Schema::table('likes', function (Blueprint $table) {
                    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                    $table->foreign('gallery_id')->references('id')->on('galleries')->onDelete('cascade');
                });
            } catch (\Throwable $e) {
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
