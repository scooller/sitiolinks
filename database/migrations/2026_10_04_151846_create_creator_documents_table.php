<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creator_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_profile_id')->constrained()->cascadeOnDelete();
            // 3 archivos via spatie media-library: id_front, id_back, selfie_with_id
            $table->enum('type', ['id_card', 'passport', 'other'])->default('id_card');
            $table->boolean('verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            // audit: quién vio el documento (GDPR)
            $table->json('viewed_by')->nullable();
            $table->timestamps();

            $table->index('creator_user_id');
            $table->index('manager_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_documents');
    }
};
