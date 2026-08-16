<?php

namespace App\Console\Commands;

use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Console\Command;

class SendLowStockAlerts extends Command
{
    protected $signature = 'inventory:send-low-stock-alerts';
    protected $description = 'Send staff notifications for inventory items that are low or out of stock.';

    public function handle(NotificationService $notifications): int
    {
        $items = InventoryItem::query()
            ->where(function ($query): void {
                $query->where('quantity', '<=', 0)
                    ->orWhere(function ($lowStock): void {
                        $lowStock->whereNotNull('reorder_level')
                            ->whereColumn('quantity', '<=', 'reorder_level');
                    });
            })
            ->get();

        foreach ($items as $item) {
            $isOut = (int) $item->quantity <= 0;
            $notifications->notifyStaffAndAdmins(
                $isOut ? 'Inventory Out of Stock' : 'Inventory Low Stock',
                $isOut
                    ? "{$item->name} is out of stock."
                    : "{$item->name} is low on stock ({$item->quantity} remaining; reorder at {$item->reorder_level}).",
                $isOut ? 'inventory_out_of_stock' : 'inventory_low_stock',
                $item->id,
                InventoryItem::class,
                ['link' => '/inventory', 'sku' => $item->sku, 'quantity' => $item->quantity],
            );
        }

        $this->info("Low-stock scan completed for {$items->count()} item(s).");

        return self::SUCCESS;
    }
}
