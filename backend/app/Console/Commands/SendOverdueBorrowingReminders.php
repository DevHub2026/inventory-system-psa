<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Borrowing\Models\Borrowing;
use App\Notifications\OverdueBorrowingReminder;
use Illuminate\Console\Command;

class SendOverdueBorrowingReminders extends Command
{
    protected $signature = 'borrowings:send-overdue-reminders';
    protected $description = 'Send overdue borrowing reminders to users who have email notifications enabled.';

    public function handle(): int
    {
        $overdueBorrowings = Borrowing::query()
            ->with(['user', 'asset'])
            ->where('status', 'overdue')
            ->whereHas('user', function ($query) {
                $query->where('status', 'active')->where('email_notifications_enabled', true);
            })
            ->get();

        $count = 0;

        foreach ($overdueBorrowings as $borrowing) {
            $user = $borrowing->user;
            if (! $user || ! $user->email) {
                continue;
            }

            // Idempotency: avoid sending duplicate reminders for the same borrowing
            // within a 24-hour window. Use the notifications table to record that
            // a reminder was sent and skip if a recent one exists.
            // Idempotency check: only skip if a previous reminder for this borrowing
            // was already queued (mail_queued = true) within the last 24 hours. We
            // store a small flag in the notification data to indicate whether the
            // mail job was dispatched successfully; this avoids suppressing retries
            // when queuing fails.
            $recent = \App\Models\Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'overdue_reminder')
                ->where('related_id', $borrowing->id)
                ->where('created_at', '>=', now()->subDay())
                ->where('data->mail_queued', true)
                ->exists();

            if ($recent) {
                continue;
            }

            // Create a DB notification record (so the UI can show the reminder).
            // Include a 'mail_queued' flag in data which will be updated to true
            // only after the notify() call succeeds in dispatching the queued job.
            $dbNotif = \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => 'Overdue borrowed item',
                'message' => 'You have an overdue borrowed item: '.($borrowing->asset?->name ?? 'Unknown'),
                'type' => 'overdue_reminder',
                'is_read' => false,
                'related_id' => $borrowing->id,
                'related_type' => 'borrowing',
                'data' => [
                    'asset_id' => $borrowing->asset_id,
                    'asset_name' => $borrowing->asset?->name,
                    'asset_number' => $borrowing->asset?->asset_number,
                    'due_date' => $borrowing->due_date?->toDateString(),
                    'mail_queued' => false,
                ],
            ]);

            // Send the email notification (queued) using the Notification class which
            // will respect the user's email_notifications_enabled flag. If dispatch
            // throws, we leave 'mail_queued' as false so the next scheduler run can retry.
            try {
                $user->notify(new OverdueBorrowingReminder($borrowing));

                // Mark the DB notification as mail_queued = true to indicate we
                // successfully dispatched the mail job.
                $dbNotif->update(['data' => array_merge($dbNotif->data ?? [], ['mail_queued' => true])]);

                $count++;
            } catch (\Throwable $e) {
                logger()->warning('Failed to queue OverdueBorrowingReminder: '.$e->getMessage());
                // Do not increment $count so the log accurately reflects actually queued mails.
            }
        }

        $this->info("Overdue reminders sent for {$count} borrowing(s).");

        return 0;
    }
}
