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

            $user->notify(new OverdueBorrowingReminder($borrowing));
            $count++;
        }

        $this->info("Overdue reminders sent for {$count} borrowing(s).");

        return 0;
    }
}
