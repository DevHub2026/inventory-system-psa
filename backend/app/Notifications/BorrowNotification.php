<?php

namespace App\Notifications;

use App\Models\Borrow;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BorrowNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Borrow|Borrowing $borrow,
        public readonly User $user,
        public readonly Asset $asset
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Asset Borrow Request')
            ->greeting('Hello Admin,')
            ->line("{$this->user->getFullNameAttribute()} has borrowed the following asset:")
            ->line("**Asset Code:** {$this->asset->asset_number}")
            ->line("**Asset Name:** {$this->asset->name}")
            ->line("**Borrowed At:** {$this->borrowDateLabel()}")
            ->when($this->borrow->due_date, function ($message) {
                $message->line("**Due Date:** {$this->borrow->due_date->format('F j, Y')}");
            })
            ->when($this->borrowNotes(), function ($message) {
                $message->line("**Notes:** {$this->borrowNotes()}");
            })
            ->line('Please review the borrow request in the system.')
            ->action('View Asset', url('/assets/' . $this->asset->id))
            ->line('Thank you for using the PSA Inventory System!');
    }

    public function toArray($notifiable): array
    {
        return [
            'borrow_id' => $this->borrow->id,
            'user_id' => $this->user->id,
            'asset_id' => $this->asset->id,
            'asset_name' => $this->asset->name,
            'asset_number' => $this->asset->asset_number,
            'borrowed_at' => $this->borrow instanceof Borrowing ? $this->borrow->borrow_date : $this->borrow->borrowed_at,
        ];
    }

    private function borrowDateLabel(): string
    {
        if ($this->borrow instanceof Borrowing) {
            return $this->borrow->borrow_date?->format('F j, Y') ?? now()->format('F j, Y');
        }

        return $this->borrow->borrowed_at->format('F j, Y, g:i a');
    }

    private function borrowNotes(): ?string
    {
        return $this->borrow instanceof Borrowing ? $this->borrow->remarks : $this->borrow->notes;
    }
}
