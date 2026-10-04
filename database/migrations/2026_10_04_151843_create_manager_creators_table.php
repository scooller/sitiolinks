<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manager_creators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manager_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_user_id')->constrained('users')->cascadeOnDelete();
            // email alternativo de contacto (puede ser el del manager u otro)
            $table->string('contact_email')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'inactive'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['manager_profile_id', 'creator_user_id']);
            $table->index('creator_user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manager_creators');
    }
};
