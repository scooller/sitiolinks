<?php

namespace Tests\Feature;

use App\Events\CreatorApproved;
use App\Events\CreatorRejected;
use App\Mail\CreatorApprovedMail;
use App\Mail\CreatorRejectedMail;
use App\Models\Cafe;
use App\Models\CafeBranch;
use App\Models\CreatorDocument;
use App\Models\ManagerCreator;
use App\Models\ManagerProfile;
use App\Models\Notification;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManagerSystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $managerUser;

    protected ManagerProfile $managerProfile;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::fake('public');

        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'creator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $this->managerUser = User::factory()->create([
            'name' => 'Manager One',
            'username' => 'manager1',
            'email' => 'manager@example.com',
        ]);
        $this->managerUser->assignRole('manager');

        $this->managerProfile = ManagerProfile::create([
            'user_id' => $this->managerUser->id,
            'status' => 'active',
        ]);
    }

    public function test_manager_can_get_profile(): void
    {
        $response = $this->actingAs($this->managerUser)
            ->getJson('/api/manager/profile');

        $response->assertStatus(200)
            ->assertJsonPath('profile.id', $this->managerProfile->id)
            ->assertJsonPath('profile.status', 'active');
    }

    public function test_manager_can_create_creator_with_age_validation(): void
    {
        // 1. Debe rechazar menores de 18 años
        $underAgeResponse = $this->actingAs($this->managerUser)
            ->postJson('/api/manager/creators', [
                'name' => 'Minor Person',
                'username' => 'minorperson',
                'gender' => 'mujer',
                'birth_date' => now()->subYears(17)->toDateString(),
                'legal_accepted' => true,
            ]);

        $underAgeResponse->assertStatus(422)
            ->assertJsonValidationErrors(['birth_date']);

        // 2. Acepta mayores de 18 años
        $validResponse = $this->actingAs($this->managerUser)
            ->postJson('/api/manager/creators', [
                'name' => 'Adult Creator',
                'username' => 'adultcreator',
                'gender' => 'mujer',
                'birth_date' => now()->subYears(20)->toDateString(),
                'contact_email' => 'manager_contact@example.com',
                'legal_accepted' => true,
            ]);

        $validResponse->assertStatus(201)
            ->assertJsonStructure([
                'creator' => ['id', 'name', 'username'],
                'manager_creator' => ['id', 'status'],
                'document_id',
                'magic_login_url',
            ]);

        $this->assertDatabaseHas('manager_creators', [
            'manager_profile_id' => $this->managerProfile->id,
            'status' => ManagerCreator::STATUS_PENDING,
            'contact_email' => 'manager_contact@example.com',
        ]);

        $creatorUser = User::where('username', 'adultcreator')->first();
        $this->assertNotNull($creatorUser);
        $this->assertNotNull($creatorUser->magic_link_token);
    }

    public function test_manager_can_upload_identification_documents(): void
    {
        $creator = User::factory()->create([
            'username' => 'creator_docs',
            'birth_date' => now()->subYears(22)->toDateString(),
        ]);

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_PENDING,
        ]);

        $document = CreatorDocument::create([
            'creator_user_id' => $creator->id,
            'manager_profile_id' => $this->managerProfile->id,
            'type' => 'id_card',
        ]);

        $fileFront = UploadedFile::fake()->image('dni_front.jpg');
        $fileBack = UploadedFile::fake()->image('dni_back.jpg');
        $fileSelfie = UploadedFile::fake()->image('selfie.jpg');

        // Subir frontal
        $res1 = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/documents/{$document->id}/upload", [
                'collection' => 'id_front',
                'file' => $fileFront,
            ]);
        $res1->assertStatus(200)->assertJsonPath('complete', false);

        // Subir reverso
        $res2 = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/documents/{$document->id}/upload", [
                'collection' => 'id_back',
                'file' => $fileBack,
            ]);
        $res2->assertStatus(200)->assertJsonPath('complete', false);

        // Subir selfie con ID
        $res3 = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/documents/{$document->id}/upload", [
                'collection' => 'selfie_with_id',
                'file' => $fileSelfie,
            ]);
        $res3->assertStatus(200)->assertJsonPath('complete', true);

        $this->assertTrue($document->fresh()->isComplete());
    }

    public function test_admin_approving_creator_fires_event_assigns_role_and_notifies_manager(): void
    {
        Mail::fake();

        $creator = User::factory()->create([
            'name' => 'New Creator',
            'username' => 'newcreator',
            'email' => 'new@example.com',
        ]);
        $creator->assignRole('user');

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_PENDING,
        ]);

        $admin = User::factory()->create(['name' => 'Admin Boss']);
        $admin->assignRole('admin');

        // Disparar evento de aprobación (como lo hace el botón de Filament)
        $managerCreator->update([
            'status' => ManagerCreator::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        CreatorApproved::dispatch($managerCreator, $admin->id);

        // Creador ahora tiene rol creator
        $this->assertTrue($creator->fresh()->hasRole('creator'));

        // Manager recibe notificación en base de datos
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->managerUser->id,
            'type' => Notification::TYPE_CREATOR_APPROVED,
        ]);

        // Email enviado al manager
        Mail::assertQueued(CreatorApprovedMail::class, function ($mail) {
            return $mail->hasTo($this->managerUser->email)
                && $mail->creator->name === 'New Creator';
        });
    }

    public function test_admin_rejecting_creator_notifies_manager_with_reason(): void
    {
        Mail::fake();

        $creator = User::factory()->create([
            'name' => 'Rejected Creator',
            'username' => 'rejectedcreator',
        ]);

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_PENDING,
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $reason = 'Documento no legible o borroso';

        $managerCreator->update([
            'status' => ManagerCreator::STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);

        CreatorRejected::dispatch($managerCreator, $reason, $admin->id);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->managerUser->id,
            'type' => Notification::TYPE_CREATOR_REJECTED,
        ]);

        Mail::assertQueued(CreatorRejectedMail::class, function ($mail) use ($reason) {
            return $mail->hasTo($this->managerUser->email)
                && $mail->reason === $reason;
        });
    }

    public function test_creator_can_login_via_magic_link_and_set_password(): void
    {
        $rawToken = 'secret-magic-token-12345';
        $creator = User::factory()->create([
            'username' => 'magicuser',
            'magic_link_token' => hash('sha256', $rawToken),
            'magic_link_expires_at' => now()->addDay(),
        ]);

        // 1. Consume magic link
        $response = $this->postJson('/api/auth/magic-link', [
            'token' => $rawToken,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.username', 'magicuser');

        // Token fue invalidado (consumo de un solo uso)
        $this->assertNull($creator->fresh()->magic_link_token);

        // 2. Establecer contraseña definitiva
        $passwordResponse = $this->actingAs($creator)
            ->postJson('/api/auth/magic-link/set-password', [
                'password' => 'StrongPassword123#',
                'password_confirmation' => 'StrongPassword123#',
            ]);

        $passwordResponse->assertStatus(200);
    }

    public function test_suspended_manager_cannot_access_manager_panel(): void
    {
        $this->managerProfile->update(['status' => 'suspended']);

        $panel = Filament::getPanel('manager');
        $this->assertFalse($this->managerUser->fresh()->canAccessPanel($panel));
    }

    public function test_cannot_regenerate_magic_link_for_approved_creator(): void
    {
        $creator = User::factory()->create();

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_APPROVED,
        ]);

        $response = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/magic-link");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'El creador ya fue aprobado y cuenta con acceso regular. Debe utilizar el flujo de restablecimiento de contraseña.');
    }

    public function test_updating_documents_after_approval_resets_verification(): void
    {
        $creator = User::factory()->create([
            'username' => 'creator_reverify',
            'birth_date' => now()->subYears(25)->toDateString(),
        ]);

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_APPROVED,
        ]);

        $document = CreatorDocument::create([
            'creator_user_id' => $creator->id,
            'manager_profile_id' => $this->managerProfile->id,
            'type' => 'id_card',
            'verified' => true,
        ]);

        $fileFront = UploadedFile::fake()->image('dni_new.jpg');

        $response = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/documents/{$document->id}/upload", [
                'collection' => 'id_front',
                'file' => $fileFront,
            ]);

        $response->assertStatus(200);

        // Debe haber revocado verificación y regresado a pendiente
        $this->assertFalse((bool) $document->fresh()->verified);
        $this->assertSame(ManagerCreator::STATUS_PENDING, $managerCreator->fresh()->status);
    }

    public function test_manager_can_send_notification_to_creator(): void
    {
        $creator = User::factory()->create(['username' => 'creatorsend']);

        $managerCreator = ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_APPROVED,
        ]);

        $response = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/creators/{$managerCreator->id}/notify", [
                'title' => 'Reunión semanal',
                'message' => 'Por favor actualiza tus fotos de perfil.',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $creator->id,
            'type' => Notification::TYPE_MANAGER_MESSAGE,
            'title' => 'Reunión semanal',
        ]);
    }

    public function test_manager_cafe_can_add_and_remove_creators_to_branch(): void
    {
        $cafe = Cafe::create([
            'name' => 'Café Manager',
            'slug' => 'cafe-manager',
        ]);

        $branch = CafeBranch::create([
            'cafe_id' => $cafe->id,
            'name' => 'Sucursal Centro',
            'address' => 'Av. Providencia 1234',
        ]);

        $this->managerProfile->update(['cafe_id' => $cafe->id]);

        $creator = User::factory()->create();

        ManagerCreator::create([
            'manager_profile_id' => $this->managerProfile->id,
            'creator_user_id' => $creator->id,
            'status' => ManagerCreator::STATUS_APPROVED,
        ]);

        // Añadir creador al café
        $addResponse = $this->actingAs($this->managerUser)
            ->postJson("/api/manager/cafe/creators/{$creator->id}");
        $addResponse->assertStatus(200);

        $this->assertTrue($branch->fresh()->creators->contains($creator->id));

        // Quitar creador del café
        $removeResponse = $this->actingAs($this->managerUser)
            ->deleteJson("/api/manager/cafe/creators/{$creator->id}");
        $removeResponse->assertStatus(200);

        $this->assertFalse($branch->fresh()->creators->contains($creator->id));
    }

    public function test_document_media_access_control_and_headers(): void
    {
        $creator = User::factory()->create();

        $document = CreatorDocument::create([
            'creator_user_id' => $creator->id,
            'manager_profile_id' => $this->managerProfile->id,
            'type' => 'id_card',
        ]);

        $file = UploadedFile::fake()->image('id_test.jpg');
        $media = $document->addMedia($file)->toMediaCollection('id_front');

        // 1. Manager puede ver el documento
        $resManager = $this->actingAs($this->managerUser)
            ->get("/creator-documents/{$media->id}");
        $resManager->assertStatus(200);
        $resManager->assertHeader('X-Content-Type-Options', 'nosniff');
        $resManager->assertHeader('Pragma', 'no-cache');

        // 2. El propio creador puede ver su documento (ARCOP)
        $resCreator = $this->actingAs($creator)
            ->get("/creator-documents/{$media->id}");
        $resCreator->assertStatus(200);

        // 3. Usuario no autorizado recibe 403
        $stranger = User::factory()->create();
        $stranger->assignRole('user');
        $resStranger = $this->actingAs($stranger)
            ->get("/creator-documents/{$media->id}");
        $resStranger->assertStatus(403);
    }
}
