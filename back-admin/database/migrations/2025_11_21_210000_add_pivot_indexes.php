<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // gallery_allowed_users (gallery_id,user_id)
        if (Schema::hasTable('gallery_allowed_users')) {
            Schema::table('gallery_allowed_users', function (Blueprint $table) {
                $this->addCompositeIndexIfMissing($table, 'gallery_allowed_users', ['gallery_id', 'user_id']);
            });
        }

        // user_follower (following_id,follower_id)
        if (Schema::hasTable('user_follower')) {
            Schema::table('user_follower', function (Blueprint $table) {
                $this->addCompositeIndexIfMissing($table, 'user_follower', ['following_id', 'follower_id']);
            });
        }

        // user_tag (user_id,tag_id)
        if (Schema::hasTable('user_tag')) {
            Schema::table('user_tag', function (Blueprint $table) {
                $this->addCompositeIndexIfMissing($table, 'user_tag', ['user_id', 'tag_id']);
            });
        }

        // gallery_media (gallery_id,media_id)
        if (Schema::hasTable('gallery_media')) {
            Schema::table('gallery_media', function (Blueprint $table) {
                $this->addCompositeIndexIfMissing($table, 'gallery_media', ['gallery_id', 'media_id']);
            });
        }
    }

    public function down(): void
    {
        $this->dropCompositeIndexIfExists('gallery_allowed_users', ['gallery_id', 'user_id']);
        $this->dropCompositeIndexIfExists('user_follower', ['following_id', 'follower_id']);
        $this->dropCompositeIndexIfExists('user_tag', ['user_id', 'tag_id']);
        $this->dropCompositeIndexIfExists('gallery_media', ['gallery_id', 'media_id']);
    }

    private function addCompositeIndexIfMissing(Blueprint $table, string $tableName, array $columns): void
    {
        $indexName = $this->compositeIndexName($tableName, $columns);
        if (! $this->hasIndex($tableName, $indexName)) {
            $table->index($columns, $indexName);
        }
    }

    private function dropCompositeIndexIfExists(string $tableName, array $columns): void
    {
        $indexName = $this->compositeIndexName($tableName, $columns);
        if ($this->hasIndex($tableName, $indexName)) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        }
    }

    private function compositeIndexName(string $tableName, array $columns): string
    {
        return $tableName.'_'.implode('_', $columns).'_index';
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->selectOne(
            'SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND table_name = ? 
             AND index_name = ?',
            [$database, $table, $indexName]
        );

        return $result->count > 0;
    }
};
