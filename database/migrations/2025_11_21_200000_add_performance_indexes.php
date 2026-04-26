<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users table indexes
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! $this->indexExists('users', 'users_price_from_index')) {
                    $table->index('price_from', 'users_price_from_index');
                }
                if (! $this->indexExists('users', 'users_gender_index')) {
                    $table->index('gender', 'users_gender_index');
                }
                if (! $this->indexExists('users', 'users_views_index')) {
                    $table->index('views', 'users_views_index');
                }
                if (! $this->indexExists('users', 'users_nationality_index')) {
                    $table->index('nationality', 'users_nationality_index');
                }
            });
        }

        // Galleries table indexes
        if (Schema::hasTable('galleries')) {
            Schema::table('galleries', function (Blueprint $table) {
                if (! $this->indexExists('galleries', 'galleries_user_id_index')) {
                    $table->index('user_id', 'galleries_user_id_index');
                }
                if (! $this->indexExists('galleries', 'galleries_status_visibility_index')) {
                    $table->index(['status', 'visibility'], 'galleries_status_visibility_index');
                }
                if (! $this->indexExists('galleries', 'galleries_is_featured_featured_at_index')) {
                    $table->index(['is_featured', 'featured_at'], 'galleries_is_featured_featured_at_index');
                }
            });
        }

        // Media table indexes (Spatie)
        if (Schema::hasTable('media')) {
            Schema::table('media', function (Blueprint $table) {
                if (! $this->indexExists('media', 'media_model_collection_index')) {
                    $table->index(['model_type', 'model_id', 'collection_name'], 'media_model_collection_index');
                }
            });
        }

        // Notifications table indexes (if exists)
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (! $this->indexExists('notifications', 'notifications_user_id_read_at_index')) {
                    $table->index(['user_id', 'read_at'], 'notifications_user_id_read_at_index');
                }
            });
        }
    }

    public function down(): void
    {
        // Drop indexes carefully
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $this->dropIndexIfExists('users', 'users_price_from_index');
                $this->dropIndexIfExists('users', 'users_gender_index');
                $this->dropIndexIfExists('users', 'users_views_index');
                $this->dropIndexIfExists('users', 'users_nationality_index');
            });
        }
        if (Schema::hasTable('galleries')) {
            Schema::table('galleries', function (Blueprint $table) {
                $this->dropIndexIfExists('galleries', 'galleries_user_id_index');
                $this->dropIndexIfExists('galleries', 'galleries_status_visibility_index');
                $this->dropIndexIfExists('galleries', 'galleries_is_featured_featured_at_index');
            });
        }
        if (Schema::hasTable('media')) {
            Schema::table('media', function (Blueprint $table) {
                $this->dropIndexIfExists('media', 'media_model_collection_index');
            });
        }
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $this->dropIndexIfExists('notifications', 'notifications_user_id_read_at_index');
            });
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->selectOne(
            'SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND table_name = ? 
             AND index_name = ?',
            [$database, $table, $index]
        );

        return $result->count > 0;
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if ($this->indexExists($table, $index)) {
            Schema::table($table, function (Blueprint $table) use ($index) {
                $table->dropIndex($index);
            });
        }
    }
};
