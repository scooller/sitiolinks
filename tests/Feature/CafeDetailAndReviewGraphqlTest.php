<?php

namespace Tests\Feature;

use App\Models\Cafe;
use App\Models\CafeBranch;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CafeDetailAndReviewGraphqlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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

        if (! Schema::hasTable('cafe_branch_tag')) {
            Schema::create('cafe_branch_tag', function (Blueprint $table): void {
                $table->foreignId('cafe_branch_id')->constrained('cafe_branches')->onDelete('cascade');
                $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
                $table->timestamps();

                $table->primary(['cafe_branch_id', 'tag_id']);
            });
        }
    }

    public function test_public_cafe_detail_returns_branch_creators(): void
    {
        $cafe = Cafe::query()->create([
            'name' => 'Cafe Detalle',
            'description' => 'Descripcion cafe',
        ]);

        $branch = CafeBranch::query()->create([
            'cafe_id' => $cafe->id,
            'name' => 'Sucursal Centro',
            'address' => 'Calle Centro 123',
            'city' => 'Santiago',
        ]);

        $creator = User::factory()->create([
            'name' => 'Creador Uno',
            'username' => 'creador-uno',
        ]);

        $branch->creators()->attach($creator->id);

        $query = <<<'GRAPHQL'
query CafeDetail($id: ID!) {
  cafeDetail(id: $id) {
    id
    name
    branches {
      id
      name
      creators {
        id
                username
      }
    }
  }
}
GRAPHQL;

        $response = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => [
                'id' => $cafe->id,
            ],
        ]);

        $response->assertOk();
        $response->assertJsonMissingPath('errors.0.message');

        $branches = data_get($response->json(), 'data.cafeDetail.branches', []);
        $this->assertCount(1, $branches);

        $creators = $branches[0]['creators'] ?? [];
        $this->assertCount(1, $creators);
        $this->assertSame($creator->id, (int) $creators[0]['id']);
        $this->assertSame('creador-uno', $creators[0]['username']);
    }

    public function test_authenticated_user_can_create_branch_review_with_mutation(): void
    {
        $user = User::factory()->create();

        $cafe = Cafe::query()->create([
            'name' => 'Cafe Reseñas',
        ]);

        $branch = CafeBranch::query()->create([
            'cafe_id' => $cafe->id,
            'name' => 'Sucursal Sur',
            'address' => 'Avenida Sur 456',
            'city' => 'Valparaiso',
        ]);

        $mutation = <<<'GRAPHQL'
mutation CreateCafeBranchReview($branchId: ID!, $rating: Int!, $comment: String) {
  createCafeBranchReview(branch_id: $branchId, rating: $rating, comment: $comment) {
    id
    rating
    comment
    user {
      id
    }
  }
}
GRAPHQL;

        $response = $this
            ->actingAs($user)
            ->postJson('/graphql', [
                'query' => $mutation,
                'variables' => [
                    'branchId' => $branch->id,
                    'rating' => 5,
                    'comment' => 'Excelente sucursal',
                ],
            ]);

        $response->assertOk();
        $response->assertJsonMissingPath('errors.0.message');

        $this->assertDatabaseHas('cafe_branch_reviews', [
            'cafe_branch_id' => $branch->id,
            'user_id' => $user->id,
            'rating' => 5,
            'comment' => 'Excelente sucursal',
        ]);
    }
}
