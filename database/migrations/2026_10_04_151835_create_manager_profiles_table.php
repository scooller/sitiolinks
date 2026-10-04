<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manager_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('cafe_id')->nullable()->constrained('cafes')->nullOnDelete();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('cafe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manager_profiles');
    }
};
