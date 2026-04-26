<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('media', function (Blueprint $table) {
            $table->longText('file_name')->change();
            $table->longText('name')->change();
        });
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('media', function (Blueprint $table) {
            $table->string('file_name', 255)->change();
            $table->string('name', 255)->change();
        });
    }
};
