<?php

namespace App\Notifications;

use App\Modules\Borrowing\Models\Borrowing;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OverdueBorrowingReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Borrowing $borrowing)
    {
    }

    public function via($notifiable): array
    {
        if (! $notifiable instanceof User || ! $notifiable->email_notifications_enabled) {
            return [];
        }

        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Overdue Borrowed Item Reminder')
            ->greeting('Hello ' . ($notifiable->full_name ?: $notifiable->email) . ',')
            ->line('You have an overdue borrowed item. Please return it as soon as possible to avoid further issues.')
            ->line('Asset: ' . $this->borrowing->asset?->name)
            ->line('Asset Number: ' . $this->borrowing->asset?->asset_number)
            ->line('Due Date: ' . $this->borrowing->due_date?->format('F j, Y'))
            ->action('View Borrowings', url('/borrowings'))
            ->line('Thank you for using the PSA Inventory System.');
    }

    public function toArray($notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'asset_id' => $this->borrowing->asset_id,
            'asset_name' => $this->borrowing->asset?->name,
            'asset_number' => $this->borrowing->asset?->asset_number,
            'due_date' => $this->borrowing->due_date?->toDateString(),
        ];
    }
}
