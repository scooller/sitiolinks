<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpenGraphControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_og_endpoint_returns_user_metadata(): void
    {
        $user = User::factory()->create([
            'name' => 'Valentina Rojas',
            'username' => 'valerajas_' . uniqid(),
            'description' => 'Modelo y creadora de contenido en Santiago Centro.',
        ]);

        $response = $this->get('/api/og/user/' . $user->username);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
        $response->assertSee("Valentina Rojas (@{$user->username}) - Link Persons", false);
        $response->assertSee('Modelo y creadora de contenido en Santiago Centro.', false);
        $response->assertSee('property="og:title"', false);
        $response->assertSee('property="og:image"', false);
        $response->assertSee('name="twitter:card"', false);
    }

    public function test_og_endpoint_handles_missing_user(): void
    {
        $response = $this->get('/api/og/user/nonexistent_user_999999');

        $response->assertStatus(404);
        $response->assertSee('Perfil no encontrado - Link Persons', false);
    }
}
