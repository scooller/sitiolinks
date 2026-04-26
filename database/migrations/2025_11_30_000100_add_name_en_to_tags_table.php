<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tags') || Schema::hasColumn('tags', 'name_en')) {
            return;
        }

        Schema::table('tags', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tags') || ! Schema::hasColumn('tags', 'name_en')) {
            return;
        }

        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn('name_en');
        });
    }
};
