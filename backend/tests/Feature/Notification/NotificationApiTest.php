<?php

namespace Tests\Feature\Notification;

use App\Models\Notification;
use App\Models\User;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Notification\Services\NotificationService;
use Database\Factories\AssetFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_notifications_newest_first(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $token = $user->createToken('auth')->plainTextToken;

        $older = Notification::create([
            'user_id' => $user->id,
            'title' => 'Older',
            'message' => 'Older message',
            'type' => 'info',
            'is_read' => false,
        ]);
        $older->forceFill([
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ])->saveQuietly();

        Notification::create([
            'user_id' => $user->id,
            'title' => 'Newer',
            'message' => 'Newer message',
            'type' => 'borrow_request',
            'is_read' => false,
        ]);

        $response = $this->withToken($token)->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $items = $response->json('data.items');
        $this->assertCount(2, $items);
        $this->assertEquals('Newer', $items[0]['title']);
        $this->assertEquals(2, $response->json('data.meta.unread_count'));
    }

    public function test_mark_as_read_and_unread_count(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $token = $user->createToken('auth')->plainTextToken;

        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => 'Return notice',
            'message' => 'Asset returned',
            'type' => 'asset_returned',
            'is_read' => false,
        ]);

        $this->withToken($token)
            ->getJson('/api/v1/notifications/unread-count')
            ->assertStatus(200)
            ->assertJsonPath('data.unread_count', 1);

        $this->withToken($token)
            ->postJson('/api/v1/notifications/'.$notification->id.'/read')
            ->assertStatus(200)
            ->assertJsonPath('data.is_read', true);

        $this->withToken($token)
            ->getJson('/api/v1/notifications/unread-count')
            ->assertStatus(200)
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_service_prevents_duplicate_unread_notifications(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $service = app(NotificationService::class);

        $first = $service->notifyUser($user->id, 'Low Stock', 'Paper is low', 'inventory_low_stock', 10, 'InventoryItem');
        $second = $service->notifyUser($user->id, 'Low Stock', 'Paper is low', 'inventory_low_stock', 10, 'InventoryItem');

        $this->assertNotNull($first);
        $this->assertNull($second);
        $this->assertEquals(1, Notification::query()->where('user_id', $user->id)->count());
    }

    public function test_resend_mail_configuration_is_active(): void
    {
        config()->set('mail.default', 'resend');
        config()->set('mail.mailers.resend.transport', 'resend');
        config()->set('services.resend.key', 'test_resend_key');

        $this->assertSame('resend', config('mail.default'));
        $this->assertSame('resend', config('mail.mailers.resend.transport'));
        $this->assertSame('resend', Mail::getDefaultDriver());
        $this->assertSame('test_resend_key', config('services.resend.key'));
    }

    public function test_overdue_reminder_command_handles_postgres_notification_data(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_notifications_enabled' => true,
            'email' => 'delivered@resend.dev',
        ]);

        $asset = AssetFactory::new()->create();

        $borrowing = Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(10)->toDateString(),
            'due_date' => now()->subDays(1)->toDateString(),
            'status' => 'overdue',
            'remarks' => 'Test reminder workflow',
        ]);

        Notification::create([
            'user_id' => $user->id,
            'title' => 'Overdue borrowed item',
            'message' => 'You have an overdue borrowed item.',
            'type' => 'overdue_reminder',
            'is_read' => false,
            'related_id' => $borrowing->id,
            'related_type' => 'borrowing',
            'data' => ['mail_queued' => true],
        ]);

        $this->artisan('borrowings:send-overdue-reminders')->assertSuccessful();

        $this->assertSame(1, Notification::query()
            ->where('user_id', $user->id)
            ->where('type', 'overdue_reminder')
            ->where('related_id', $borrowing->id)
            ->count());
    }
}
