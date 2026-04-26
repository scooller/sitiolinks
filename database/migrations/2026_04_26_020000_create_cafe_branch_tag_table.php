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
        if (Schema::hasTable('cafe_branch_tag')) {
            return;
        }

        Schema::create('cafe_branch_tag', function (Blueprint $table) {
            $table->foreignId('cafe_branch_id')->constrained('cafe_branches')->onDelete('cascade');
            $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
            $table->timestamps();

            $table->primary(['cafe_branch_id', 'tag_id']);
            $table->index('cafe_branch_id');
            $table->index('tag_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cafe_branch_tag');
    }
};
