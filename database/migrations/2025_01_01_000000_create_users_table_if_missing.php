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
        if (Schema::hasTable('users')) {
            return;
        }

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('nationality')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->text('description')->nullable();
            $table->string('gender')->nullable();
            $table->string('country_block')->nullable();
            $table->date('birth_date')->nullable();
            $table->decimal('price_from', 10, 2)->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('email');
            $table->index('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op intentionally: this migration is a fallback for test/dev environments
        // where the users table may not be provided by legacy dumps.
    }
};
