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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subject');
            $table->longText('content');
            $table->text('description')->nullable();
            $table->json('variables')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('email_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('email_template_id')->nullable()->constrained('email_templates')->nullOnDelete();
            $table->string('subject')->nullable();
            $table->longText('content')->nullable();
            $table->string('target_audience')->default('all')->index();
            $table->string('type')->default('one_time')->index(); // 'one_time', 'recurring'
            $table->string('recurring_frequency')->nullable(); // 'daily', 'weekly', 'monthly'
            $table->time('recurring_time')->nullable();
            $table->unsignedTinyInteger('recurring_day_of_week')->nullable(); // 0 = Sunday, 6 = Saturday
            $table->unsignedTinyInteger('recurring_day_of_month')->nullable(); // 1 to 31
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable()->index();
            $table->string('status')->default('draft')->index(); // 'draft', 'scheduled', 'processing', 'completed', 'paused'
            $table->integer('total_recipients')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->timestamps();
        });

        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->string('to')->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('email_campaign_id')->nullable()->constrained('email_campaigns')->nullOnDelete();
            $table->string('subject');
            $table->longText('body_html');
            $table->string('status')->default('sent')->index(); // 'sent', 'failed', 'queued'
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('email_campaigns');
        Schema::dropIfExists('email_templates');
    }
};
