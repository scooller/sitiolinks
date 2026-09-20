<?php

namespace Tests\Feature;

use App\Mail\UserRoleChangedMail;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserRoleChangedNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'vip', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'creator', 'guard_name' => 'web']);
    }

    public function test_notify_role_changed_creates_notification_and_sends_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'testuser@example.com',
            'username' => 'testuser',
            'name' => 'Test User',
        ]);
        $user->assignRole('user');

        $notification = NotificationService::notifyRoleChanged($user, 'vip', 'user');

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'user_id' => $user->id,
            'type' => Notification::TYPE_SYSTEM,
        ]);
        $this->assertSame('vip', $notification->data['new_role']);
        $this->assertSame('user', $notification->data['old_role']);

        Mail::assertQueued(UserRoleChangedMail::class, function (UserRoleChangedMail $mail) use ($user) {
            return $mail->hasTo('testuser@example.com')
                && $mail->newRole === 'vip'
                && $mail->oldRole === 'user'
                && $mail->user->id === $user->id;
        });
    }

    public function test_user_role_changed_mailable_renders_properly(): void
    {
        $user = User::factory()->create([
            'username' => 'vipgirl',
            'name' => 'VIP Girl',
            'email' => 'vip@example.com',
        ]);

        $mailable = new UserRoleChangedMail($user, 'vip', 'user');
        $mailable->assertSeeInHtml('vipgirl');
        $mailable->assertSeeInHtml('VIP');
        $mailable->assertSeeInHtml('Normal / Usuario');
        $mailable->assertHasSubject('Tu tipo de cuenta ahora es VIP - '.config('app.name'));
    }
}
