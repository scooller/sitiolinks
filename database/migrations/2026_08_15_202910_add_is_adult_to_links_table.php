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
        // ponytail: guard — links se crea via dump MySQL, no via migración (sqlite de tests no la tiene)
        if (! Schema::hasTable('links') || Schema::hasColumn('links', 'is_adult')) {
            return;
        }

        Schema::table('links', function (Blueprint $table) {
            $table->boolean('is_adult')->default(false)->after('icon');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('links', 'is_adult')) {
            return;
        }

        Schema::table('links', function (Blueprint $table) {
            $table->dropColumn('is_adult');
        });
    }
};
