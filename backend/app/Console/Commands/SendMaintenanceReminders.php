<?php

namespace App\Console\Commands;

use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Console\Command;

class SendMaintenanceReminders extends Command
{
    protected $signature = 'maintenance:send-reminders';
    protected $description = 'Send staff notifications for upcoming and overdue maintenance records.';

    public function handle(NotificationService $notifications): int
    {
        $maintenances = Maintenance::query()
            ->with('asset')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereDate('scheduled_date', '<=', now()->addDays(3)->toDateString())
            ->get();

        foreach ($maintenances as $maintenance) {
            $overdue = $maintenance->scheduled_date?->isPast() === true;
            $notifications->notifyStaffAndAdmins(
                $overdue ? 'Maintenance Overdue' : 'Maintenance Reminder',
                ($maintenance->asset?->name ?? 'An asset').' has maintenance '.($overdue ? 'overdue' : 'scheduled soon').'.',
                $overdue ? 'maintenance_overdue' : 'maintenance_reminder',
                $maintenance->id,
                Maintenance::class,
                [
                    'link' => '/maintenance',
                    'asset_id' => $maintenance->asset_id,
                    'scheduled_date' => $maintenance->scheduled_date?->toDateString(),
                ],
            );
        }

        $this->info("Maintenance reminder scan completed for {$maintenances->count()} record(s).");

        return self::SUCCESS;
    }
}
