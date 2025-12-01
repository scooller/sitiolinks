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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('followers_count')->default(0)->index()->after('views');
            $table->unsignedBigInteger('following_count')->default(0)->index()->after('followers_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['followers_count']);
            $table->dropIndex(['following_count']);
            $table->dropColumn(['followers_count', 'following_count']);
        });
    }
};
