<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Gallery;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SecurityPatchesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'creator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        if (! Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table): void {
                $table->id();
                $table->string('name')->unique();
                $table->string('color')->default('primary');
                $table->string('icon')->nullable();
                $table->integer('weight')->default(0);
                $table->boolean('is_fixed')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('user_tag')) {
            Schema::create('user_tag', function (Blueprint $table): void {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
                $table->timestamps();
                $table->primary(['user_id', 'tag_id']);
            });
        }

        if (! Schema::hasTable('links')) {
            Schema::create('links', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('name');
                $table->string('url');
                $table->string('icon')->nullable();
                $table->boolean('is_adult')->default(false);
                $table->integer('order')->default(0);
                $table->timestamps();
            });
        }
    }

    public function test_anonymous_query_galleries_cannot_leak_private_galleries(): void
    {
        $owner = User::factory()->create(['email_verified_at' => now()]);

        Gallery::create([
            'user_id' => $owner->id,
            'title' => 'Secret Private Album',
            'description' => 'Should never be public',
            'visibility' => Gallery::VISIBILITY_PRIVATE,
            'status' => Gallery::STATUS_APPROVED,
        ]);

        Gallery::create([
            'user_id' => $owner->id,
            'title' => 'Public Album',
            'description' => 'Open to all',
            'visibility' => Gallery::VISIBILITY_PUBLIC,
            'status' => Gallery::STATUS_APPROVED,
        ]);

        $query = '
            query GetGalleries($userId: Int!, $vis: String) {
                galleries(user_id: $userId, visibility: $vis) {
                    data {
                        id
                        title
                        visibility
                    }
                }
            }
        ';

        // Guest attempting to query private galleries via visibility argument
        $response = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => [
                'userId' => $owner->id,
                'vis' => 'private',
            ],
        ]);

        $response->assertOk();
        $items = $response->json('data.galleries.data');
        $this->assertEmpty($items, 'Anonymous user must never see private galleries');
    }

    public function test_create_link_mutation_rejects_javascript_protocol(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $mutation = '
            mutation CreateLink($name: String!, $url: String!) {
                createLink(name: $name, url: $url) {
                    id
                    name
                    url
                }
            }
        ';

        $response = $this->actingAs($user, 'web')->postJson('/graphql', [
            'query' => $mutation,
            'variables' => [
                'name' => 'XSS Vector',
                'url' => 'javascript:alert(1)',
            ],
        ]);

        $this->assertNotEmpty($response->json('errors'));
    }

    public function test_user_type_masks_birth_date_and_privacy_consent_for_guests(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'birth_date' => '1995-06-15',
            'privacy_consent_at' => now(),
        ]);

        $query = '
            query GetUser($username: String!) {
                user(username: $username) {
                    id
                    username
                    birth_date
                    privacy_consent_at
                }
            }
        ';

        $response = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => [
                'username' => $user->username,
            ],
        ]);

        $response->assertOk();
        $this->assertNull($response->json('data.user.birth_date'), 'Guest must not see exact birth_date');
        $this->assertNull($response->json('data.user.privacy_consent_at'), 'Guest must not see privacy_consent_at');
    }

    public function test_login_endpoint_rate_limiting(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', [
                'email' => 'ratelimit@example.com',
                'password' => 'wrongpassword',
            ]);
        }

        // 7th request in the same minute must hit 429
        $response = $this->postJson('/api/login', [
            'email' => 'ratelimit@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(429);
    }
}
