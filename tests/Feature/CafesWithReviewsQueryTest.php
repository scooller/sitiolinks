<?php

namespace Tests\Feature;

use App\Models\Cafe;
use App\Models\CafeBranch;
use App\Models\CafeBranchReview;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CafesWithReviewsQueryTest extends TestCase
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

    public function test_public_cafes_with_reviews_filters_by_tag_city_and_min_rating(): void
    {
        $matchingTag = Tag::query()->create([
            'name' => 'WiFi',
            'color' => 'primary',
            'is_fixed' => false,
        ]);

        $otherTag = Tag::query()->create([
            'name' => 'Pet Friendly',
            'color' => 'success',
            'is_fixed' => false,
        ]);

        $matchingCafe = Cafe::query()->create([
            'name' => 'Cafe Centro',
            'description' => 'Sucursal principal',
        ]);

        $nonMatchingCafe = Cafe::query()->create([
            'name' => 'Cafe Norte',
            'description' => 'Sucursal alterna',
        ]);

        $matchingBranch = CafeBranch::query()->create([
            'cafe_id' => $matchingCafe->id,
            'name' => 'Centro 1',
            'address' => 'Calle 1',
            'city' => 'Bogota',
        ]);
        $matchingBranch->tags()->attach($matchingTag->id);

        $wrongTagBranch = CafeBranch::query()->create([
            'cafe_id' => $matchingCafe->id,
            'name' => 'Centro 2',
            'address' => 'Calle 2',
            'city' => 'Bogota',
        ]);
        $wrongTagBranch->tags()->attach($otherTag->id);

        $wrongCityBranch = CafeBranch::query()->create([
            'cafe_id' => $nonMatchingCafe->id,
            'name' => 'Norte 1',
            'address' => 'Avenida 9',
            'city' => 'Medellin',
        ]);
        $wrongCityBranch->tags()->attach($matchingTag->id);

        $reviewAuthor = User::factory()->create();

        CafeBranchReview::query()->create([
            'cafe_branch_id' => $matchingBranch->id,
            'user_id' => $reviewAuthor->id,
            'rating' => 5,
            'comment' => 'Excelente',
        ]);

        CafeBranchReview::query()->create([
            'cafe_branch_id' => $wrongTagBranch->id,
            'user_id' => $reviewAuthor->id,
            'rating' => 5,
            'comment' => 'Buen sitio',
        ]);

        CafeBranchReview::query()->create([
            'cafe_branch_id' => $wrongCityBranch->id,
            'user_id' => $reviewAuthor->id,
            'rating' => 5,
            'comment' => 'Muy bueno',
        ]);

        $query = <<<'GRAPHQL'
query CafesWithReviews($city: String, $minRating: Float, $tagId: Int) {
  cafesWithReviews(city: $city, min_rating: $minRating, tag_id: $tagId, branches_per_cafe: 5, reviews_per_branch: 5) {
    id
    name
    branches {
      id
      city
      tags {
        id
        name
      }
      reviews {
        id
        rating
      }
    }
  }
}
GRAPHQL;

        $response = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => [
                'city' => 'Bogota',
                'minRating' => 4,
                'tagId' => $matchingTag->id,
            ],
        ]);

        $response->assertOk();
        $response->assertJsonMissingPath('errors.0.message');

        $cafes = data_get($response->json(), 'data.cafesWithReviews', []);
        $this->assertCount(1, $cafes);
        $this->assertSame($matchingCafe->id, (int) $cafes[0]['id']);

        $branches = $cafes[0]['branches'] ?? [];
        $this->assertCount(1, $branches);
        $this->assertSame($matchingBranch->id, (int) $branches[0]['id']);
        $this->assertSame('Bogota', $branches[0]['city']);

        $tags = $branches[0]['tags'] ?? [];
        $this->assertCount(1, $tags);
        $this->assertSame($matchingTag->id, (int) $tags[0]['id']);

        $reviews = $branches[0]['reviews'] ?? [];
        $this->assertCount(1, $reviews);
        $this->assertSame(5, (int) $reviews[0]['rating']);

        $this->assertNotSame($wrongTagBranch->id, (int) $branches[0]['id']);
        $this->assertNotSame($wrongCityBranch->id, (int) $branches[0]['id']);
        $this->assertNotSame($nonMatchingCafe->id, (int) $cafes[0]['id']);
    }
}
