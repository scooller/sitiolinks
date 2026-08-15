<?php

namespace Tests\Feature;

use App\Events\NotificationCreated;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_persists_notification_and_broadcasts_event(): void
    {
        Event::fake();
        $user = User::factory()->create();

        $notification = NotificationService::create(
            user: $user,
            type: Notification::TYPE_SYSTEM,
            title: 'Hola',
            message: 'Mensaje del sistema',
            data: ['foo' => 'bar'],
            url: '/algun-lugar'
        );

        $this->assertTrue($notification->exists);
        $this->assertSame($user->id, $notification->user_id);
        $this->assertSame(['foo' => 'bar'], $notification->data);

        Event::assertDispatched(NotificationCreated::class, fn (NotificationCreated $event) => $event->notification->is($notification));
    }

    public function test_create_accepts_raw_user_id(): void
    {
        Event::fake();
        $user = User::factory()->create();

        $notification = NotificationService::create(
            user: $user->id,
            type: Notification::TYPE_SYSTEM,
            title: 'Hola',
            message: 'Por id',
        );

        $this->assertSame($user->id, $notification->user_id);
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);
    }

    public function test_notify_new_follower_builds_follow_notification(): void
    {
        Event::fake();
        $followed = User::factory()->create();
        $follower = User::factory()->create();

        $notification = NotificationService::notifyNewFollower($followed, $follower);

        $this->assertSame(Notification::TYPE_FOLLOW, $notification->type);
        $this->assertSame('Nuevo seguidor', $notification->title);
        $this->assertSame("@{$follower->username} ahora te sigue.", $notification->message);
        $this->assertSame("/u/{$follower->username}", $notification->url);
        $this->assertEquals($follower->id, $notification->data['follower_id']);
    }

    public function test_gallery_notifications_map_types_and_urls(): void
    {
        Event::fake();
        $owner = User::factory()->create();

        $approved = NotificationService::notifyGalleryApproved($owner, 1, 'Fotos 2026');
        $rejected = NotificationService::notifyGalleryRejected($owner, 2, 'Borradores');
        $featured = NotificationService::notifyGalleryFeatured($owner, 3, 'Destacadas');

        $this->assertSame(Notification::TYPE_GALLERY_APPROVED, $approved->type);
        $this->assertSame(Notification::TYPE_GALLERY_REJECTED, $rejected->type);
        $this->assertSame(Notification::TYPE_GALLERY_FEATURED, $featured->type);

        $expectedUrl = "/u/{$owner->username}/galleries";
        $this->assertSame($expectedUrl, $approved->url);
        $this->assertSame($expectedUrl, $rejected->url);
        $this->assertSame($expectedUrl, $featured->url);
    }

    public function test_mark_all_as_read_updates_only_pending_for_that_user(): void
    {
        Event::fake();
        $user = User::factory()->create();
        $other = User::factory()->create();

        NotificationService::create($user, Notification::TYPE_SYSTEM, 'a', 'a');
        NotificationService::create($user, Notification::TYPE_SYSTEM, 'b', 'b');
        NotificationService::create($other, Notification::TYPE_SYSTEM, 'c', 'c');

        $updated = NotificationService::markAllAsRead($user);

        $this->assertSame(2, $updated);
        $this->assertSame(0, NotificationService::getUnreadCount($user));
        $this->assertSame(1, NotificationService::getUnreadCount($other));
    }

    public function test_get_vip_unread_count_filters_by_type(): void
    {
        Event::fake();
        $user = User::factory()->create();

        $sender = User::factory()->create();
        NotificationService::notifyVipUserMessage($user, $sender, 'hola vip');
        NotificationService::notifyVipUserMessage($user, $sender, 'otro vip');
        NotificationService::notifyNewFollower($user, $sender);

        $this->assertSame(2, NotificationService::getVipUnreadCount($user));
        $this->assertSame(3, NotificationService::getUnreadCount($user));
    }
}
