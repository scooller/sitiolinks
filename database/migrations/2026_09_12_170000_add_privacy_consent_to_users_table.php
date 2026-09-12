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
            $table->boolean('privacy_consent')->default(false)->after('warning_modal_dismissed');
            $table->timestamp('privacy_consent_at')->nullable()->after('privacy_consent');
            $table->string('privacy_policy_version', 50)->nullable()->default('v2026.1')->after('privacy_consent_at');
            $table->boolean('search_indexing_opt_in')->default(true)->after('privacy_policy_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'privacy_consent',
                'privacy_consent_at',
                'privacy_policy_version',
                'search_indexing_opt_in',
            ]);
        });
    }
};
