<?php

namespace App\Modules\Inventory\Services;

use App\Enums\UserRole;
use App\Models\InventoryCategory;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\StockTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class InventoryService
{
    public function export(array $filters = []): string
    {
        $items = InventoryItem::query()->with('asset', 'category', 'unit', 'supplier')
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('sku', 'like', '%'.$search.'%')
                        ->orWhere('unit', 'like', '%'.$search.'%');
                });
            })
            ->when(! empty($filters['status']), function ($query) use ($filters) {
                match ($filters['status']) {
                    'OUT_OF_STOCK' => $query->where('quantity', '<=', 0),
                    'LOW_STOCK' => $query->where('quantity', '>', 0)->whereColumn('quantity', '<=', 'reorder_level'),
                    'IN_STOCK' => $query->where('quantity', '>', 0)->where(function ($q) {
                        $q->whereNull('reorder_level')->orWhere('reorder_level', '<=', 0)->orWhereColumn('quantity', '>', 'reorder_level');
                    }),
                    default => null,
                };
            })
            ->orderByDesc('created_at')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventory Export');

        // Headers
        $headers = [
            'ID', 'Item Name', 'SKU/Code', 'Category', 'Unit', 'Quantity',
            'Reorder Level', 'Status', 'Linked Asset No.', 'Supplier',
            'Remarks', 'Created At', 'Updated At',
        ];
        foreach (array_values($headers) as $i => $header) {
            $sheet->setCellValue(chr(65 + $i).'1', $header);
            $sheet->getStyle(chr(65 + $i).'1')->getFont()->setBold(true);
        }

        // Data rows
        $row = 2;
        foreach ($items as $item) {
            $status = match (true) {
                $item->quantity <= 0 => 'Out of Stock',
                $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'Low Stock',
                default => 'In Stock',
            };

            $sheet->setCellValue('A'.$row, $item->id);
            $sheet->setCellValue('B'.$row, $item->name);
            $sheet->setCellValue('C'.$row, $item->sku ?? '');
            $sheet->setCellValue('D'.$row, $item->category?->name ?? '');
            $sheet->setCellValue('E'.$row, $item->unit ?? '');
            $sheet->setCellValue('F'.$row, $item->quantity);
            $sheet->setCellValue('G'.$row, $item->reorder_level ?? '');
            $sheet->setCellValue('H'.$row, $status);
            $sheet->setCellValue('I'.$row, $item->asset?->asset_number ?? '');
            $sheet->setCellValue('J'.$row, $item->supplier?->name ?? '');
            $sheet->setCellValue('K'.$row, $item->remarks ?? '');
            $sheet->setCellValue('L'.$row, $item->created_at?->format('Y-m-d H:i:s') ?? '');
            $sheet->setCellValue('M'.$row, $item->updated_at?->format('Y-m-d H:i:s') ?? '');
            $row++;
        }

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'inventory-export-'.now()->format('Y-m-d-His').'.xlsx';
        $path = 'exports/'.$filename;
        Storage::makeDirectory('exports');

        $writer = new Xlsx($spreadsheet);
        $writer->save(Storage::path($path));

        return $path;
    }

    /**
     * Import inventory items from an Excel file.
     * Validates entire file first, then imports in a single transaction.
     *
     * @return array{imported: int, skipped: int, errors: array}
     */
    public function importFromExcel(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        if (count($rows) < 2) {
            throw new \InvalidArgumentException('The Excel file is empty or has no data rows.');
        }

        $headers = array_map('trim', $rows[0]);
        $expectedHeaders = ['name', 'sku', 'category_name', 'unit', 'quantity', 'reorder_level', 'remarks'];

        // Validate headers
        $headerMap = [];
        foreach ($expectedHeaders as $expected) {
            $index = array_search($expected, $headers, true);
            if ($index === false) {
                throw new \InvalidArgumentException("Missing required column: '{$expected}'. Found columns: ".implode(', ', $headers));
            }
            $headerMap[$expected] = $index;
        }

        // Parse and validate all rows first
        $validRows = [];
        $errors = [];
        $rowNum = 1; // 1-indexed, header is row 1

        foreach (array_slice($rows, 1) as $row) {
            $rowNum++;
            $row = array_map('trim', $row);
            $name = $row[$headerMap['name']] ?? '';

            if (empty($name)) {
                $errors[] = "Row {$rowNum}: Item name is required.";
                continue;
            }

            $sku = $row[$headerMap['sku']] ?? '';
            $categoryName = $row[$headerMap['category_name']] ?? '';
            $unit = $row[$headerMap['unit']] ?? '';
            $quantity = (int) ($row[$headerMap['quantity']] ?? 0);
            $reorderLevel = $row[$headerMap['reorder_level']] ?? null;
            $remarks = $row[$headerMap['remarks']] ?? '';

            // Validate category exists
            if (! empty($categoryName)) {
                $category = InventoryCategory::query()->where('name', $categoryName)->first();
                if (! $category) {
                    $errors[] = "Row {$rowNum}: Category '{$categoryName}' not found.";
                    continue;
                }
            } else {
                $category = null;
            }

            // Check for duplicate SKU
            if (! empty($sku) && InventoryItem::query()->where('sku', $sku)->exists()) {
                $errors[] = "Row {$rowNum}: Item with SKU '{$sku}' already exists.";
                continue;
            }

            $validRows[] = [
                'name' => $name,
                'sku' => $sku,
                'inventory_category_id' => $category?->id,
                'unit' => $unit,
                'quantity' => $quantity,
                'reorder_level' => $reorderLevel !== '' ? (int) $reorderLevel : null,
                'remarks' => $remarks,
            ];
        }

        // If there are errors, return them without importing
        if (! empty($errors)) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => $errors];
        }

        // Import valid rows in a transaction
        $imported = 0;
        DB::transaction(function () use ($validRows, &$imported) {
            foreach ($validRows as $row) {
                InventoryItem::create($row);
                $imported++;
            }
        });

        return [
            'imported' => $imported,
            'skipped' => 0,
            'errors' => [],
        ];
    }
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = InventoryItem::query()->with('asset');

        // Filter by inventory type (non_expendable / expendable)
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('sku', 'like', '%'.$search.'%')
                    ->orWhere('unit', 'like', '%'.$search.'%');
            });
        }

        if (! empty($filters['status'])) {
            match ($filters['status']) {
                'OUT_OF_STOCK' => $query->where('quantity', '<=', 0),
                'LOW_STOCK' => $query->where('quantity', '>', 0)->whereColumn('quantity', '<=', 'reorder_level'),
                'IN_STOCK' => $query->where('quantity', '>', 0)->where(function ($query): void {
                    $query->whereNull('reorder_level')
                        ->orWhere('reorder_level', '<=', 0)
                        ->orWhereColumn('quantity', '>', 'reorder_level');
                }),
                default => null,
            };
        } elseif (isset($filters['low_stock'])) {
            $query->where('quantity', '>', 0)->whereColumn('quantity', '<=', 'reorder_level');
        }

        return $query->orderByDesc('created_at')->paginate(min(max($perPage, 1), 100));
    }

    public function create(array $data, ?User $user = null): InventoryItem
    {
        return DB::transaction(function () use ($data, $user) {
            $trackAsAsset = (bool) ($data['track_as_asset'] ?? true);
            unset($data['track_as_asset']);

            // Default type based on track_as_asset if not explicitly provided:
            // items linked to assets are non_expendable; pure consumables are expendable.
            if (empty($data['type'])) {
                $data['type'] = $trackAsAsset ? 'non_expendable' : 'expendable';
            }

            $item = InventoryItem::create($data);

            if ($item->quantity > 0) {
                $this->recordMovement(
                    $item,
                    'stock_in',
                    $item->quantity,
                    0,
                    $item->quantity,
                    'Initial inventory quantity',
                    $user,
                );
            }

            if ($trackAsAsset) {
                $asset = $this->createAssetForInventoryItem($item);
                $item->update(['asset_id' => $asset->id]);
            }

            return $item->fresh('asset');
        });
    }

    public function update(InventoryItem $item, array $data): InventoryItem
    {
        $trackAsAsset = (bool) ($data['track_as_asset'] ?? false);
        unset($data['track_as_asset']);

        if (array_key_exists('quantity', $data) && (int) $data['quantity'] !== (int) $item->quantity) {
            throw new \InvalidArgumentException('Use Correct Stock Quantity to change quantity and provide a reason.');
        }

        $item->update($data);

        if ($trackAsAsset && ! $item->asset_id) {
            $asset = $this->createAssetForInventoryItem($item->fresh());
            $item->update(['asset_id' => $asset->id]);
        }

        $this->syncLinkedAsset($item->fresh('asset'));

        return $item->fresh('asset');
    }

    public function delete(InventoryItem $item): void
    {
        $item->load('asset');

        if ($item->asset) {
            $item->asset->delete();
        }

        $item->delete();
    }

    public function stockIn(InventoryItem $item, int $quantity, ?string $reason = null, ?User $user = null): InventoryItem
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($item, $quantity, $reason, $user): InventoryItem {
            $before = $item->quantity;
            $after = $before + $quantity;

            $item->update(['quantity' => $after]);
            $this->recordMovement($item, 'stock_in', $quantity, $before, $after, $reason, $user);
            $this->syncLinkedAsset($item->fresh('asset'));

            return $item->fresh('asset');
        });
    }

    public function stockOut(InventoryItem $item, int $quantity, ?string $reason = null, ?User $user = null): InventoryItem
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero.');
        }

        if ($item->quantity < $quantity) {
            throw new \InvalidArgumentException('Insufficient stock for stock-out operation.');
        }

        return DB::transaction(function () use ($item, $quantity, $reason, $user): InventoryItem {
            $before = $item->quantity;
            $after = $before - $quantity;

            $item->update(['quantity' => $after]);
            $this->recordMovement($item, 'stock_out', -$quantity, $before, $after, $reason, $user);
            $this->syncLinkedAsset($item->fresh('asset'));

            return $item->fresh('asset');
        });
    }

    public function adjust(InventoryItem $item, int $newQuantity, string $reason, ?User $user = null): InventoryItem
    {
        if ($newQuantity < 0) {
            throw new \InvalidArgumentException('Corrected quantity cannot be negative.');
        }

        return DB::transaction(function () use ($item, $newQuantity, $reason, $user): InventoryItem {
            $before = $item->quantity;
            $difference = $newQuantity - $before;

            if ($difference === 0) {
                throw new \InvalidArgumentException('Corrected quantity is the same as the current quantity.');
            }

            $item->update(['quantity' => $newQuantity]);
            $this->recordMovement($item, 'adjustment', $difference, $before, $newQuantity, $reason, $user);
            $this->syncLinkedAsset($item->fresh('asset'));

            return $item->fresh('asset');
        });
    }

    public function history(InventoryItem $item, int $perPage = 20): LengthAwarePaginator
    {
        return $item->stockTransactions()
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    private function recordMovement(
        InventoryItem $item,
        string $type,
        int $quantity,
        int $quantityBefore,
        int $quantityAfter,
        ?string $reason = null,
        ?User $user = null,
    ): void {
        StockTransaction::query()->create([
            'inventory_item_id' => $item->id,
            'type' => $type,
            'quantity' => $quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'user_id' => $user?->id ?? auth()->id(),
            'reason' => $reason,
        ]);
    }

    private function createAssetForInventoryItem(InventoryItem $item): Asset
    {
        $asset = Asset::query()->create([
            'asset_number' => $this->uniqueAssetNumber($item->sku ?: 'INV-'.$item->id),
            'name' => $item->name,
            'description' => 'Linked from inventory item #'.$item->id.'.',
            'asset_category_id' => $this->defaultInventoryCategory()->id,
            'office_id' => $this->defaultOffice()->id,
            'status' => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
            'remarks' => $item->remarks,
        ]);

        AssetIdentifier::query()->firstOrCreate(
            [
                'asset_id' => $asset->id,
                'identifier_type' => IdentifierType::PSA_QR->value,
            ],
            [
                'identifier_value' => 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT),
                'is_primary' => true,
            ],
        );

        return $asset;
    }

    private function syncLinkedAsset(InventoryItem $item): void
    {
        if (! $item->asset) {
            return;
        }

        $item->asset->update([
            'name' => $item->name,
            'status' => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'remarks' => $item->remarks,
        ]);
    }

    private function uniqueAssetNumber(string $baseAssetNumber): string
    {
        $assetNumber = $baseAssetNumber;
        $suffix = 1;

        while (Asset::query()->where('asset_number', $assetNumber)->exists()) {
            $assetNumber = $baseAssetNumber.'-'.$suffix;
            $suffix++;
        }

        return $assetNumber;
    }

    private function defaultInventoryCategory(): AssetCategory
    {
        return AssetCategory::query()->firstOrCreate(
            ['code' => 'INV'],
            [
                'name' => 'Inventory Item',
                'description' => 'Automatically linked records created from inventory items.',
                'is_active' => true,
            ],
        );
    }

    private function defaultOffice(): Office
    {
        return Office::query()->firstOrCreate(
            ['code' => 'MAIN'],
            [
                'name' => 'Main Office',
                'description' => 'Default office for inventory-linked assets.',
                'is_active' => true,
            ],
        );
    }
}
