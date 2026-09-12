<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TicketsGraphqlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'moderator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'creator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        if (! \Illuminate\Support\Facades\Schema::hasTable('tags')) {
            \Illuminate\Support\Facades\Schema::create('tags', function (\Illuminate\Database\Schema\Blueprint $table): void {
                $table->id();
                $table->string('name')->unique();
                $table->string('color')->default('primary');
                $table->string('icon')->nullable();
                $table->integer('weight')->default(0);
                $table->boolean('is_fixed')->default(false);
                $table->timestamps();
            });
        }

        if (! \Illuminate\Support\Facades\Schema::hasTable('user_tag')) {
            \Illuminate\Support\Facades\Schema::create('user_tag', function (\Illuminate\Database\Schema\Blueprint $table): void {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
                $table->timestamps();
                $table->primary(['user_id', 'tag_id']);
            });
        }

        if (! \Illuminate\Support\Facades\Schema::hasTable('links')) {
            \Illuminate\Support\Facades\Schema::create('links', function (\Illuminate\Database\Schema\Blueprint $table): void {
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

    public function test_guest_cannot_view_ticket(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'Consulta tecnica',
            'description' => 'Descripcion detallada del ticket',
            'category' => 'tecnico',
            'priority' => 'media',
            'status' => Ticket::STATUS_OPEN,
        ]);

        $query = '
            query GetTicket($id: ID!) {
                ticket(id: $id) {
                    id
                    subject
                }
            }
        ';

        $response = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['id' => $ticket->id],
        ]);

        $response->assertOk();
        $this->assertNull($response->json('data.ticket'));
    }

    public function test_other_user_cannot_view_foreign_ticket(): void
    {
        $owner = User::factory()->create(['email_verified_at' => now()]);
        $intruder = User::factory()->create(['email_verified_at' => now()]);
        $ticket = Ticket::create([
            'user_id' => $owner->id,
            'subject' => 'Ticket privado del dueno',
            'description' => 'Descripcion secreta del dueno',
            'category' => 'facturacion',
            'priority' => 'alta',
            'status' => Ticket::STATUS_OPEN,
        ]);

        $query = '
            query GetTicket($id: ID!) {
                ticket(id: $id) {
                    id
                    subject
                }
            }
        ';

        $response = $this->actingAs($intruder, 'web')->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['id' => $ticket->id],
        ]);

        $response->assertOk();
        $this->assertNull($response->json('data.ticket'));
    }

    public function test_owner_can_view_ticket_and_internal_comments_are_hidden(): void
    {
        $owner = User::factory()->create(['email_verified_at' => now()]);
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $ticket = Ticket::create([
            'user_id' => $owner->id,
            'subject' => 'Mi ticket de soporte',
            'description' => 'Tengo un problema con una galeria',
            'category' => 'tecnico',
            'priority' => 'media',
            'status' => Ticket::STATUS_OPEN,
        ]);

        // Comentario publico
        TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'comment' => 'Hola, estamos revisando tu caso.',
            'is_internal' => false,
        ]);

        // Nota interna
        TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'comment' => 'Nota interna confidencial para el equipo.',
            'is_internal' => true,
        ]);

        $query = '
            query GetTicket($id: ID!) {
                ticket(id: $id) {
                    id
                    subject
                    comments {
                        id
                        comment
                        is_internal
                    }
                }
            }
        ';

        // Visor como dueno
        $ownerResponse = $this->actingAs($owner, 'web')->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['id' => $ticket->id],
        ]);

        $ownerResponse->assertOk();
        $this->assertEquals($ticket->id, $ownerResponse->json('data.ticket.id'));
        $comments = $ownerResponse->json('data.ticket.comments');
        $this->assertCount(1, $comments);
        $this->assertEquals('Hola, estamos revisando tu caso.', $comments[0]['comment']);

        // Visor como admin
        $adminResponse = $this->actingAs($admin, 'web')->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['id' => $ticket->id],
        ]);

        $adminResponse->assertOk();
        $adminComments = $adminResponse->json('data.ticket.comments');
        $this->assertCount(2, $adminComments);
    }

    public function test_tickets_list_isolates_by_authenticated_user(): void
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);

        Ticket::create([
            'user_id' => $user1->id,
            'subject' => 'Ticket de User 1',
            'description' => 'Descripcion de ticket 1',
            'category' => 'tecnico',
            'priority' => 'baja',
            'status' => Ticket::STATUS_OPEN,
        ]);

        Ticket::create([
            'user_id' => $user2->id,
            'subject' => 'Ticket de User 2',
            'description' => 'Descripcion de ticket 2',
            'category' => 'cuenta',
            'priority' => 'media',
            'status' => Ticket::STATUS_OPEN,
        ]);

        $query = '
            query GetTickets {
                tickets {
                    id
                    subject
                }
            }
        ';

        // Invitado no autenticado: lista vacia
        $guestResponse = $this->postJson('/graphql/public', [
            'query' => $query,
        ]);

        $guestResponse->assertOk();
        $this->assertCount(0, $guestResponse->json('data.tickets'));

        // Como usuario 1: solo debe ver su propio ticket
        $response1 = $this->actingAs($user1, 'web')->postJson('/graphql/public', [
            'query' => $query,
        ]);

        $response1->assertOk();
        $data1 = $response1->json('data.tickets');
        $this->assertCount(1, $data1);
        $this->assertEquals('Ticket de User 1', $data1[0]['subject']);
    }

    public function test_create_ticket_requires_auth_and_prevents_impersonation(): void
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);

        $mutation = '
            mutation CreateTicket($user_id: Int, $subject: String!, $description: String!, $category: String!, $priority: String!) {
                createTicket(user_id: $user_id, subject: $subject, description: $description, category: $category, priority: $priority) {
                    id
                    subject
                }
            }
        ';

        // Intento como invitado
        $guestResponse = $this->postJson('/graphql/public', [
            'query' => $mutation,
            'variables' => [
                'user_id' => $user1->id,
                'subject' => 'Ticket no autorizado',
                'description' => 'Descripcion de ticket no autorizado',
                'category' => 'tecnico',
                'priority' => 'media',
            ],
        ]);

        $this->assertNotEmpty($guestResponse->json('errors'));

        // Intento de suplantacion: User 1 creando ticket para User 2
        $impersonateResponse = $this->actingAs($user1, 'web')->postJson('/graphql/public', [
            'query' => $mutation,
            'variables' => [
                'user_id' => $user2->id,
                'subject' => 'Ticket suplantando a user 2',
                'description' => 'Descripcion de suplantacion de identidad',
                'category' => 'tecnico',
                'priority' => 'media',
            ],
        ]);

        $this->assertNotEmpty($impersonateResponse->json('errors'));

        // Creacion valida para si mismo
        $validResponse = $this->actingAs($user1, 'web')->postJson('/graphql/public', [
            'query' => $mutation,
            'variables' => [
                'user_id' => $user1->id,
                'subject' => 'Ticket valido propio',
                'description' => 'Descripcion correcta de mi propio ticket',
                'category' => 'tecnico',
                'priority' => 'media',
            ],
        ]);

        $validResponse->assertOk();
        $this->assertEquals('Ticket valido propio', $validResponse->json('data.createTicket.subject'));
    }

    public function test_email_is_masked_for_unauthorized_viewers(): void
    {
        $targetUser = User::factory()->create([
            'email' => 'secreto@ejemplo.com',
            'username' => 'modelosecreto',
            'email_verified_at' => now(),
        ]);
        $targetUser->assignRole('creator');

        $viewer = User::factory()->create(['email_verified_at' => now()]);

        $query = '
            query GetUser($username: String!) {
                user(username: $username) {
                    id
                    username
                    email
                }
            }
        ';

        // Como invitado
        $guestResponse = $this->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['username' => 'modelosecreto'],
        ]);

        $guestResponse->assertOk();
        $this->assertNull($guestResponse->json('data.user.email'));

        // Como otro usuario
        $otherResponse = $this->actingAs($viewer, 'web')->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['username' => 'modelosecreto'],
        ]);

        $otherResponse->assertOk();
        $this->assertNull($otherResponse->json('data.user.email'));

        // Como el propio usuario
        $this->flushSession();
        $selfResponse = $this->actingAs($targetUser, 'web')->postJson('/graphql/public', [
            'query' => $query,
            'variables' => ['username' => 'modelosecreto'],
        ]);

        $selfResponse->assertOk();
        $this->assertEquals('secreto@ejemplo.com', $selfResponse->json('data.user.email'));
    }
}
