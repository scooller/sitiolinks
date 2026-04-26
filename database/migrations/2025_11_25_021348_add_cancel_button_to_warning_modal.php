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
            $table->boolean('warning_modal_show_close_icon')->default(true);
            $table->boolean('warning_modal_cancel_btn_enabled')->default(false);
            $table->string('warning_modal_cancel_btn_text')->nullable()->default('Cancelar');
            $table->string('warning_modal_cancel_btn_icon')->nullable();
            $table->string('warning_modal_cancel_btn_variant')->nullable()->default('secondary');
            $table->string('warning_modal_cancel_btn_url')->nullable()->default('https://google.com');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn([
                'warning_modal_show_close_icon',
                'warning_modal_cancel_btn_enabled',
                'warning_modal_cancel_btn_text',
                'warning_modal_cancel_btn_icon',
                'warning_modal_cancel_btn_variant',
                'warning_modal_cancel_btn_url',
            ]);
        });
    }
};
