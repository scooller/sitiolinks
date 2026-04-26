<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VipNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'vip', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
    }

    public function test_authenticated_user_can_send_vip_notification_to_vip_recipient(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $recipient->assignRole('vip');

        $mutation = <<<'GRAPHQL'
mutation SendVipNotification($recipientId: ID!, $message: String!, $title: String) {
  sendVipNotification(recipient_id: $recipientId, message: $message, title: $title) {
    id
    type
    title
    message
  }
}
GRAPHQL;

        $response = $this->actingAs($sender, 'web')->postJson('/graphql', [
            'query' => $mutation,
            'variables' => [
                'recipientId' => (string) $recipient->id,
                'message' => 'Hola VIP',
                'title' => 'Nuevo contacto',
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.sendVipNotification.type', Notification::TYPE_VIP_USER_MESSAGE);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $recipient->id,
            'type' => Notification::TYPE_VIP_USER_MESSAGE,
            'title' => 'Nuevo contacto',
            'message' => 'Hola VIP',
        ]);
    }

    public function test_send_vip_notification_rejects_non_vip_recipient(): void
    {
        $sender = User::factory()->create();
        $nonVipRecipient = User::factory()->create();
        $nonVipRecipient->assignRole('user');

        $mutation = <<<'GRAPHQL'
mutation SendVipNotification($recipientId: ID!, $message: String!) {
  sendVipNotification(recipient_id: $recipientId, message: $message) {
    id
  }
}
GRAPHQL;

        $response = $this->actingAs($sender, 'web')->postJson('/graphql', [
            'query' => $mutation,
            'variables' => [
                'recipientId' => (string) $nonVipRecipient->id,
                'message' => 'Mensaje no permitido',
            ],
        ]);

        $response->assertOk();
        $this->assertNotNull(data_get($response->json(), 'errors.0.message'));

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $nonVipRecipient->id,
            'type' => Notification::TYPE_VIP_USER_MESSAGE,
        ]);
    }

    public function test_vip_notifications_query_returns_only_authenticated_user_records(): void
    {
        $vipUser = User::factory()->create();
        $vipUser->assignRole('vip');

        $otherVipUser = User::factory()->create();
        $otherVipUser->assignRole('vip');

        Notification::query()->create([
            'user_id' => $vipUser->id,
            'type' => Notification::TYPE_VIP_USER_MESSAGE,
            'title' => 'Para VIP actual',
            'message' => 'Mensaje A',
            'data' => ['channel' => 'vip'],
        ]);

        Notification::query()->create([
            'user_id' => $otherVipUser->id,
            'type' => Notification::TYPE_VIP_USER_MESSAGE,
            'title' => 'Para otro VIP',
            'message' => 'Mensaje B',
            'data' => ['channel' => 'vip'],
        ]);

        $query = <<<'GRAPHQL'
query {
  vipNotifications(limit: 50, unread_only: false) {
    id
    user_id
    type
    title
  }
}
GRAPHQL;

        $response = $this->actingAs($vipUser, 'web')->postJson('/graphql', [
            'query' => $query,
        ]);

        $response->assertOk();
        $vipNotifications = data_get($response->json(), 'data.vipNotifications', []);

        $this->assertCount(1, $vipNotifications);
        $this->assertSame($vipUser->id, (int) $vipNotifications[0]['user_id']);
        $this->assertSame(Notification::TYPE_VIP_USER_MESSAGE, $vipNotifications[0]['type']);
    }
}
