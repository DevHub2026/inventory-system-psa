<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Modules\Asset\Models\Asset;
use App\Modules\Notification\Services\NotificationService;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckInsuranceExpiration extends Command
{
    protected $signature = 'insurance:check-expiration';
    protected $description = 'Check for insurance expirations and send notifications';

    public function __construct(private readonly NotificationService $notificationService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Checking insurance expirations...');

        $today = now()->startOfDay();
        $intervals = [30, 15, 7, 0]; // Days before expiration

        foreach ($intervals as $days) {
            $checkDate = $today->copy()->addDays($days);
            $assets = Asset::whereDate('insurance_expiration_date', $checkDate)
                ->whereNotNull('insurance_expiration_date')
                ->get();

            foreach ($assets as $asset) {
                $this->sendInsuranceNotification($asset, $days);
            }
        }

        $this->info('Insurance expiration check completed.');
        return Command::SUCCESS;
    }

    private function sendInsuranceNotification(Asset $asset, int $daysBefore): void
    {
        $admins = User::whereHas('roles', function ($query) {
            $query->where('name', 'Super Administrator')
                ->orWhere('name', 'System Administrator');
        })->get();

        $message = $this->getMessage($daysBefore, $asset);
        $title = $this->getTitle($daysBefore);

        foreach ($admins as $admin) {
            // Check if notification already exists for this asset and date
            $existing = Notification::where('user_id', $admin->id)
                ->where('type', 'insurance_expiration')
                ->where('related_id', $asset->id)
                ->where('related_type', Asset::class)
                ->where('created_at', '>=', now()->startOfDay())
                ->first();

            if (!$existing) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => $title,
                    'message' => $message,
                    'type' => 'insurance_expiration',
                    'is_read' => false,
                    'related_id' => $asset->id,
                    'related_type' => Asset::class,
                    'data' => [
                        'asset_name' => $asset->name,
                        'asset_number' => $asset->asset_number,
                        'insurance_provider' => $asset->insurance_provider,
                        'expiration_date' => $asset->insurance_expiration_date?->format('Y-m-d'),
                        'days_before' => $daysBefore,
                    ],
                ]);
            }
        }
    }

    private function getTitle(int $daysBefore): string
    {
        if ($daysBefore === 0) {
            return 'Insurance Expired Today';
        }
        return "Insurance Expiring in {$daysBefore} Days";
    }

    private function getMessage(int $daysBefore, Asset $asset): string
    {
        $date = $asset->insurance_expiration_date?->format('F d, Y');
        $provider = $asset->insurance_provider ?? 'Unknown Provider';

        if ($daysBefore === 0) {
            return "Insurance for asset '{$asset->name}' ({$asset->asset_number}) from {$provider} expired today ({$date}).";
        }

        return "Insurance for asset '{$asset->name}' ({$asset->asset_number}) from {$provider} will expire in {$daysBefore} days on {$date}.";
    }
}
