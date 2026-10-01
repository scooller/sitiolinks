<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cafe_suggestions') && ! Schema::hasColumn('cafe_suggestions', 'state')) {
            Schema::table('cafe_suggestions', function (Blueprint $table) {
                $table->string('state', 120)->nullable()->after('city');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('cafe_suggestions') && Schema::hasColumn('cafe_suggestions', 'state')) {
            Schema::table('cafe_suggestions', function (Blueprint $table) {
                $table->dropColumn('state');
            });
        }
    }
};
