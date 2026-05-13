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
        Schema::table('cafe_branches', function (Blueprint $table) {
            $table->decimal('consumo_individual', 8, 2)->nullable()->after('entry_price');
            $table->decimal('consumo_chica', 8, 2)->nullable()->after('consumo_individual');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cafe_branches', function (Blueprint $table) {
            $table->dropColumn(['consumo_individual', 'consumo_chica']);
        });
    }
};
