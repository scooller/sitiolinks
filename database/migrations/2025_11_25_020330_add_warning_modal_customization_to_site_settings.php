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
        Schema::table('site_settings', function (Blueprint $table) {
            $table->string('warning_modal_title')->nullable()->default('Aviso Importante');
            $table->string('warning_modal_title_icon')->nullable();
            $table->string('warning_modal_btn_text')->nullable()->default('Entendido');
            $table->string('warning_modal_btn_icon')->nullable();
            $table->string('warning_modal_btn_variant')->nullable()->default('primary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn([
                'warning_modal_title',
                'warning_modal_title_icon',
                'warning_modal_btn_text',
                'warning_modal_btn_icon',
                'warning_modal_btn_variant',
            ]);
        });
    }
};
