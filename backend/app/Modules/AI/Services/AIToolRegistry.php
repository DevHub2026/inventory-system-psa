<?php

namespace App\Modules\AI\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use App\Modules\Dashboard\Services\DashboardService;

class AIToolRegistry
{
    protected array $tools = [];

    public function __construct(protected DashboardService $dashboardService)
    {
        $this->registerBuiltInTools();
    }

    public function registerTool(array $toolDefinition): void
    {
        $this->tools[$toolDefinition['name']] = $toolDefinition;
    }

    public function getAvailableTools(User $user): array
    {
        $available = [];
        foreach ($this->tools as $name => $def) {
            if ($this->userCanAccessTool($user, $def)) {
                $available[] = [
                    'name' => $def['name'],
                    'description' => $def['description'] ?? '',
                    'parameters' => $def['parameters'] ?? ['type' => 'object', 'properties' => []]
                ];
            }
        }
        return $available;
    }

    public function executeTool(string $toolName, array $arguments, User $user): array
    {
        if (!isset($this->tools[$toolName])) {
            return ['success' => false, 'error' => 'tool_not_found'];
        }

        $tool = $this->tools[$toolName];

        if (!$this->userCanAccessTool($user, $tool)) {
            Log::error('Unauthorized tool execution', ['tool' => $toolName]);
            return ['success' => false, 'error' => 'unauthorized'];
        }

        try {
            $result = call_user_func($tool['handler'], $arguments, $user);
            return ['success' => true, 'tool' => $toolName, 'data' => $result];
        } catch (Exception $e) {
            Log::error("AI Tool Execution Failed: {$toolName}", ['exception' => $e->getMessage()]);
            return ['success' => false, 'error' => 'tool_execution_failed'];
        }
    }

    protected function userCanAccessTool(User $user, array $toolDefinition): bool
    {
        if (!isset($toolDefinition['permissions']) || empty($toolDefinition['permissions'])) return true;
        foreach ($toolDefinition['permissions'] as $perm) {
            if ($user->hasPermission($perm)) return true;
        }
        return false;
    }

    protected function registerBuiltInTools(): void
    {
        $this->registerTool([
            'name' => 'calculate',
            'description' => 'Safely evaluate a mathematical expression (e.g. 15% of 8500 can be 0.15 * 8500). Use for deterministic arithmetic.',
            'parameters' => [
                'type' => 'object',
                'properties' => ['expression' => ['type' => 'string']],
                'required' => ['expression']
            ],
            'permissions' => [],
            'handler' => function (array $args, User $user) {
                if (empty($args['expression'])) throw new Exception("Expression required");
                $expr = $args['expression'];
                if (!preg_match('/^[\d\s\+\-\*\/\(\)\.]+$/', $expr)) throw new Exception("Invalid or unsafe mathematical expression.");
                if (preg_match('/\/[ \t]*0(?!\.)/', $expr)) throw new Exception("Division by zero");
                try {
                    $result = @eval("return $expr;");
                    if ($result === false || $result === null) throw new Exception("Invalid expression");
                    return ['result' => $result];
                } catch (\Throwable $e) { throw new Exception("Calculation failed"); }
            }
        ]);

        $this->registerTool([
            'name' => 'get_inventory_summary',
            'description' => 'Get total distinct items and aggregate total quantity filtered by classification (PPE, SE, SUPPLY, ALL).',
            'parameters' => [
                'type' => 'object',
                'properties' => ['classification' => ['type' => 'string', 'enum' => ['PPE', 'SE', 'SUPPLY', 'ALL']]],
                'required' => ['classification']
            ],
            'permissions' => ['inventory.view'],
            'handler' => function (array $args, User $user) {
                $classification = $args['classification'] ?? 'ALL';
                $query = InventoryItem::query();
                if (in_array($classification, ['PPE', 'SE', 'SUPPLY'])) {
                    $query->where('classification', $classification);
                }
                return [
                    'classification' => $classification,
                    'count' => $query->count(),
                    'total_quantity' => (int) $query->sum('quantity'),
                ];
            }
        ]);

        $this->registerTool([
            'name' => 'search_inventory',
            'description' => 'Search inventory records by keyword (item name/sku) and optional classification.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'keyword' => ['type' => 'string'],
                    'classification' => ['type' => 'string', 'enum' => ['PPE', 'SE', 'SUPPLY', 'ALL']]
                ],
                'required' => ['keyword']
            ],
            'permissions' => ['inventory.view'],
            'handler' => function (array $args, User $user) {
                $query = InventoryItem::query();
                if (!empty($args['keyword'])) {
                    $query->where(function($q) use ($args) {
                        $q->where('name', 'ilike', '%' . $args['keyword'] . '%')
                          ->orWhere('sku', 'ilike', '%' . $args['keyword'] . '%');
                    });
                }
                if (!empty($args['classification']) && in_array($args['classification'], ['PPE', 'SE', 'SUPPLY'])) {
                    $query->where('classification', $args['classification']);
                }
                
                $items = $query->limit(10)->get();
                if ($items->isEmpty()) return ['items' => []];
                
                return ['items' => $items->map(function($item) {
                    return [
                        'name' => $item->name,
                        'classification' => $item->classification,
                        'available_quantity' => $item->quantity,
                        'reorder_level' => $item->reorder_level
                    ];
                })->toArray()];
            }
        ]);

        $this->registerTool([
            'name' => 'get_low_stock_items',
            'description' => 'Get a list of SUPPLY items that are below their reorder level.',
            'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
            'permissions' => ['inventory.view'],
            'handler' => function (array $args, User $user) {
                $items = $this->dashboardService->getLowStockItems([], $user);
                $itemsArray = is_array($items) ? $items : $items->toArray();
                
                // Limit to 15 items to prevent massive context payloads
                $itemsArray = array_slice($itemsArray, 0, 15);
                
                return array_map(function($item) {
                    return [
                        'name' => $item['name'],
                        'quantity' => $item['quantity'],
                        'reorder_level' => $item['reorder_level']
                    ];
                }, $itemsArray);
            }
        ]);

        $this->registerTool([
            'name' => 'get_my_borrowings',
            'description' => 'Get active borrowings or reservations for the currently authenticated user.',
            'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
            'permissions' => ['nav.reservations'],
            'handler' => function (array $args, User $user) {
                $reservations = Reservation::where('user_id', $user->id)
                    ->whereNotIn('status', ['RETURNED', 'CANCELLED', 'REJECTED'])
                    ->with('assets')
                    ->limit(10)
                    ->get();
                    
                return ['reservations' => $reservations->map(function($res) {
                    return [
                        'id' => $res->id,
                        'asset_name' => $res->assets->pluck('name')->join(', ') ?: 'Unknown Asset',
                        'status' => $res->status,
                        'start_date' => $res->start_date ? $res->start_date->format('Y-m-d') : null,
                        'expected_return_date' => $res->end_date ? $res->end_date->format('Y-m-d') : null,
                    ];
                })->toArray()];
            }
        ]);

        $this->registerTool([
            'name' => 'get_my_supply_requests',
            'description' => 'Get supply requests for the currently authenticated user.',
            'parameters' => ['type' => 'object', 'properties' => new \stdClass()],
            'permissions' => ['nav.reservations'],
            'handler' => function (array $args, User $user) {
                $requests = SupplyRequest::where('user_id', $user->id)
                    ->whereNotIn('status', ['FULFILLED', 'CANCELLED', 'REJECTED'])
                    ->with('items.inventoryItem')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
                    
                return ['requests' => $requests->map(function($req) {
                    return [
                        'id' => $req->id,
                        'status' => $req->status,
                        'created_at' => $req->created_at->format('Y-m-d'),
                        'items' => $req->items->map(function($item) {
                            return [
                                'name' => $item->inventoryItem->name ?? 'Unknown',
                                'quantity_requested' => $item->quantity_requested,
                                'quantity_issued' => $item->quantity_issued
                            ];
                        })->toArray()
                    ];
                })->toArray()];
            }
        ]);
    }
}


