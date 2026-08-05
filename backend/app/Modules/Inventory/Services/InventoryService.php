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
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\StockTransaction;
use App\Modules\Inventory\Services\InventoryClassificationService;
use App\Modules\Notification\Services\NotificationService;
use App\Modules\Unit\Models\Unit;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Services\TemplateRenderingService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class InventoryService
{
    private const CLASSIFICATION_PPE = 'PPE';
    private const CLASSIFICATION_SE = 'SE';
    private const CLASSIFICATION_SUPPLY = 'SUPPLY';
    private const NATURE_ACCOUNTABLE = 'ACCOUNTABLE_PROPERTY';
    private const NATURE_CONSUMABLE = 'CONSUMABLE_SUPPLY';

    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly ?TemplateRenderingService $templateRenderingService = null,
    ) {}

    public function export(array $filters = [], string $format = 'xlsx'): string
    {
        $items = InventoryItem::query()
            ->with(['asset.issuedToUser', 'unit', 'manufacturer', 'office', 'location'])
            ->when(! empty($filters['classification']), function ($query) use ($filters) {
                $query->where('classification', $filters['classification']);
            })
            ->when(! empty($filters['type']), function ($query) use ($filters) {
                $query->where('type', $filters['type']);
            })
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('sku', 'like', '%'.$search.'%')
                        ->orWhereHas('unit', function ($q) use ($search) {
                            $q->where('name', 'like', '%'.$search.'%');
                        });
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

        // Try to use a configured template first
        if ($this->templateRenderingService !== null) {
            $documentType = $format === 'csv' ? DocumentType::CSV_EXPORT : DocumentType::EXCEL_EXPORT;
            $rows = $items->map(fn ($item) => [
                'id'               => $item->id,
                'type'             => $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')),
                'item_name'        => $item->name,
                'sku'              => $item->sku ?? '',
                'property_number'  => $item->asset?->property_number ?? '',
                'unit'             => $item->unit?->name ?? $item->unit ?? '',
                'manufacturer'     => $item->manufacturer?->name ?? '',
                'office'           => $item->office?->name ?? '',
                'location'         => $item->location?->name ?? '',
                'quantity'         => $item->quantity,
                'reorder_level'    => $item->reorder_level ?? '',
                'status'           => match (true) {
                    $item->quantity <= 0 => 'Out of Stock',
                    $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'Low Stock',
                    default => 'In Stock',
                },
                'model'            => $item->asset?->model ?? '',
                'condition'        => $item->asset?->condition_status instanceof \App\Modules\Asset\Enums\ConditionStatus
                    ? $item->asset->condition_status->value
                    : ($item->asset?->condition_status ?? ''),
                'is_borrowable'    => ($item->is_borrowable ?? true) ? 'Yes' : 'No',
                'accountability'   => $item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : ($item->classification === self::CLASSIFICATION_SUPPLY
                        ? '—'
                        : (filled($item->asset?->issued_to) ? 'Issued to '.$item->asset?->issued_to : 'Unassigned')),
                'unit_cost'        => $item->unit_cost !== null ? (float) $item->unit_cost : '',
                'remarks'          => $item->remarks ?? '',
                'created_at'       => $item->created_at?->format('Y-m-d H:i:s') ?? '',
                'updated_at'       => $item->updated_at?->format('Y-m-d H:i:s') ?? '',
            ])->toArray();

            $result = $this->templateRenderingService->renderReport($documentType, [], $rows, $format);

            if ($result !== null) {
                return $result['path'];
            }
        }

        // Fall back to hardcoded generation
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventory Export');

        // Headers
        $headers = [
            'ID', 'Inventory Type', 'Item Name', 'SKU/Code', 'Property Number',
            'Unit', 'Manufacturer', 'Office', 'Location',
            'Quantity', 'Reorder Level', 'Stock Status',
            'Model Number', 'Condition', 'Asset Status',
            'Borrowable', 'Accountability', 'Remarks',
            'Unit Cost', 'Created At', 'Updated At',
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

            $conditionStatus = $item->asset?->condition_status instanceof \App\Modules\Asset\Enums\ConditionStatus
                ? $item->asset->condition_status->value
                : ($item->asset?->condition_status ?? '');

            $assetStatus = $item->asset?->status instanceof \App\Modules\Asset\Enums\AssetStatus
                ? $item->asset->status->value
                : ($item->asset?->status ?? '');

            $sheet->setCellValue('A'.$row, $item->id);
            $sheet->setCellValue('B'.$row, $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')));
            $sheet->setCellValue('C'.$row, $item->name);
            $sheet->setCellValue('D'.$row, $item->sku ?? '');
            $sheet->setCellValue('E'.$row, $item->asset?->property_number ?? '');
            $sheet->setCellValue('F'.$row, $item->unit?->name ?? $item->unit ?? '');
            $sheet->setCellValue('G'.$row, $item->manufacturer?->name ?? '');
            $sheet->setCellValue('H'.$row, $item->office?->name ?? '');
            $sheet->setCellValue('I'.$row, $item->location?->name ?? '');
            $sheet->setCellValue('J'.$row, $item->quantity);
            $sheet->setCellValue('K'.$row, $item->reorder_level ?? '');
            $sheet->setCellValue('L'.$row, $status);
            $sheet->setCellValue('M'.$row, $item->asset?->model ?? '');
            $sheet->setCellValue('N'.$row, $conditionStatus);
            $sheet->setCellValue('O'.$row, $assetStatus);
            $sheet->setCellValue('P'.$row, ($item->is_borrowable ?? true) ? 'Yes' : 'No');
            $sheet->setCellValue('Q'.$row, $item->classification === self::CLASSIFICATION_SUPPLY
                ? '—'
                : ($item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : (filled($item->asset?->issued_to) ? 'Issued to '.$item->asset?->issued_to : 'Unassigned')));
            $sheet->setCellValue('R'.$row, $item->remarks ?? '');
            $sheet->setCellValue('S'.$row, $item->unit_cost !== null ? (float) $item->unit_cost : '');
            $sheet->setCellValue('T'.$row, $item->created_at?->format('Y-m-d H:i:s') ?? '');
            $sheet->setCellValue('U'.$row, $item->updated_at?->format('Y-m-d H:i:s') ?? '');
            $row++;
        }

        foreach (range('A', 'U') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'inventory-export-'.now()->format('Y-m-d-His').'.'.$format;
        $path = 'exports/'.$filename;
        Storage::makeDirectory('exports');

        if ($format === 'csv') {
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Csv($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclose('"');
            $writer->setEscape('\\');
            $writer->save(Storage::path($path));
        } else {
            $writer = new Xlsx($spreadsheet);
            $writer->save(Storage::path($path));
        }

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
        $expectedHeaders = ['name', 'sku', 'category_name', 'unit', 'manufacturer', 'office', 'location', 'quantity', 'reorder_level', 'remarks'];

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
            $unitName = $row[$headerMap['unit']] ?? '';
            $manufacturerName = $row[$headerMap['manufacturer']] ?? '';
            $officeName = $row[$headerMap['office']] ?? '';
            $locationName = $row[$headerMap['location']] ?? '';
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

            // Validate unit exists
            $unit = null;
            if (! empty($unitName)) {
                $unit = Unit::query()->where('name', $unitName)->first();
                if (! $unit) {
                    $errors[] = "Row {$rowNum}: Unit '{$unitName}' not found in System Setup.";
                    continue;
                }
            }

            // Validate manufacturer exists
            $manufacturer = null;
            if (! empty($manufacturerName)) {
                $manufacturer = Manufacturer::query()->where('name', $manufacturerName)->first();
                if (! $manufacturer) {
                    $errors[] = "Row {$rowNum}: Manufacturer '{$manufacturerName}' not found in System Setup.";
                    continue;
                }
            }

            // Validate office exists
            $office = null;
            if (! empty($officeName)) {
                $office = Office::query()->where('name', $officeName)->first();
                if (! $office) {
                    $errors[] = "Row {$rowNum}: Office '{$officeName}' not found in System Setup.";
                    continue;
                }
            }

            // Validate location exists
            $location = null;
            if (! empty($locationName)) {
                $location = Location::query()->where('name', $locationName)->first();
                if (! $location) {
                    $errors[] = "Row {$rowNum}: Location '{$locationName}' not found in System Setup.";
                    continue;
                }
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
                'unit' => $unitName, // Keep text for backward compatibility
                'unit_id' => $unit?->id,
                'manufacturer_id' => $manufacturer?->id,
                'office_id' => $office?->id,
                'location_id' => $location?->id,
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
        $query = InventoryItem::query()->with(['asset.issuedToUser', 'unit', 'manufacturer', 'office', 'location']);

        if (! empty($filters['classification'])) {
            $query->where('classification', $filters['classification']);
        }

        // Filter by inventory type (non_expendable / expendable)
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('sku', 'like', '%'.$search.'%')
                    ->orWhere('unit', 'like', '%'.$search.'%')
                    ->orWhereHas('unit', function ($q) use ($search) {
                        $q->where('name', 'like', '%'.$search.'%');
                    });
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
            // Extract asset-level fields before normalizing inventory data
            $assetLevelFields = [];
            foreach (['model', 'condition_status', 'description', 'asset_category_id', 'property_number'] as $field) {
                if (array_key_exists($field, $data)) {
                    $assetLevelFields[$field] = $data[$field];
                    unset($data[$field]);
                }
            }

            [$data, $trackAsAsset] = $this->normalizeClassificationData($data, true);

            // SUPPLY items are never borrowable
            if (($data['classification'] ?? '') === self::CLASSIFICATION_SUPPLY) {
                $data['is_borrowable'] = false;
            } elseif (! array_key_exists('is_borrowable', $data)) {
                $data['is_borrowable'] = true;
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
                $assetPayload = [
                    'name'        => $item->name,
                    'description' => $assetLevelFields['description'] ?? 'Linked from inventory item #'.$item->id.'.',
                    'model'       => $assetLevelFields['model'] ?? null,
                    'condition_status' => $assetLevelFields['condition_status'] ?? ConditionStatus::GOOD->value,
                    'asset_category_id' => $assetLevelFields['asset_category_id'] ?? null,
                ];

                // Handle property_number uniqueness
                if (! empty($assetLevelFields['property_number'])) {
                    // Only set if not already taken
                    $propNumTaken = Asset::query()
                        ->where('property_number', $assetLevelFields['property_number'])
                        ->exists();
                    if (! $propNumTaken) {
                        $assetPayload['property_number'] = $assetLevelFields['property_number'];
                    }
                }

                $asset = $this->createAssetForInventoryItem($item, $assetPayload);
                $item->update(['asset_id' => $asset->id]);
            }

            return $item->fresh('asset');
        });
    }

    public function update(InventoryItem $item, array $data): InventoryItem
    {
        $classificationPayload = $data;
        $classificationPayload['classification'] ??= $item->classification;
        $classificationPayload['item_nature'] ??= $item->item_nature;
        $classificationPayload['type'] ??= $item->type;
        $classificationPayload['track_as_asset'] ??= (bool) $item->asset_id;

        // Extract asset-level fields before processing inventory fields
        $assetLevelFields = [];
        foreach (['model', 'condition_status', 'description', 'asset_category_id', 'property_number'] as $field) {
            if (array_key_exists($field, $data)) {
                $assetLevelFields[$field] = $data[$field];
                unset($classificationPayload[$field]);
            }
        }

        // Handle is_borrowable — if SUPPLY, force false
        if (array_key_exists('is_borrowable', $classificationPayload)) {
            $classificationPayload['is_borrowable'] = (bool) $classificationPayload['is_borrowable'];
        }

        [$data, $trackAsAsset] = $this->normalizeClassificationData($classificationPayload, (bool) $item->asset_id);

        // SUPPLY items are never borrowable
        if (($data['classification'] ?? $item->classification) === self::CLASSIFICATION_SUPPLY) {
            $data['is_borrowable'] = false;
        }

        if (array_key_exists('quantity', $data) && (int) $data['quantity'] !== (int) $item->quantity) {
            throw new \InvalidArgumentException('Use Correct Stock Quantity to change quantity and provide a reason.');
        }

        if (($data['classification'] ?? $item->classification) === self::CLASSIFICATION_SUPPLY && $item->asset_id) {
            throw new \InvalidArgumentException(
                'Cannot classify this inventory item as Supply while it remains linked to an accountable asset.',
            );
        }

        // Validate type transition: ensure the type value is valid
        if (array_key_exists('type', $data) && $data['type'] !== null) {
            $validTypes = ['non_expendable', 'expendable'];
            if (! in_array($data['type'], $validTypes, true)) {
                throw new \InvalidArgumentException(
                    "Invalid inventory type '{$data['type']}'. Valid types are: ".implode(', ', $validTypes).'.'
                );
            }
        }

        $item->update($data);

        if ($trackAsAsset && ! $item->asset_id) {
            $asset = $this->createAssetForInventoryItem($item->fresh());
            $item->update(['asset_id' => $asset->id]);
        }

        // Apply asset-level field updates through the linked asset
        if (! empty($assetLevelFields) && $item->asset_id) {
            $item->load('asset');
            if ($item->asset) {
                $validAssetFields = array_filter($assetLevelFields, fn ($v) => $v !== null || true);
                $item->asset->update($validAssetFields);
            }
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
            $this->notifyStockThresholds($item->fresh());

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
            $this->notifyStockThresholds($item->fresh());

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
            $this->notifyStockThresholds($item->fresh());

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

    private function createAssetForInventoryItem(InventoryItem $item, array $additionalPayload = []): Asset
    {
        $basePayload = [
            'asset_number'      => $this->uniqueAssetNumber($item->sku ?: 'INV-'.$item->id),
            'name'              => $item->name,
            'description'       => 'Linked from inventory item #'.$item->id.'.',
            'asset_category_id' => $this->defaultInventoryCategory()->id,
            'office_id'         => $item->office_id ?? $this->defaultOffice()->id,
            'location_id'       => $item->location_id,
            'manufacturer_id'   => $item->manufacturer_id,
            'status'            => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'condition_status'  => ConditionStatus::GOOD->value,
            'remarks'           => $item->remarks,
        ];

        // Merge additional payload (overrides base where present, but never overrides asset_number)
        unset($additionalPayload['asset_number']);
        $payload = array_merge($basePayload, array_filter($additionalPayload, fn ($v) => $v !== null));

        // Use explicit asset_category_id if provided, otherwise keep default
        if (empty($payload['asset_category_id'])) {
            $payload['asset_category_id'] = $this->defaultInventoryCategory()->id;
        }

        $asset = Asset::query()->create($payload);

        AssetIdentifier::query()->firstOrCreate(
            [
                'asset_id'        => $asset->id,
                'identifier_type' => IdentifierType::PSA_QR->value,
            ],
            [
                'identifier_value' => 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT),
                'is_primary'       => true,
            ],
        );

        return $asset;
    }

    private function syncLinkedAsset(InventoryItem $item): void
    {
        if (! $item->asset) {
            return;
        }

        $payload = [
            'name'    => $item->name,
            'status'  => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'remarks' => $item->remarks,
        ];

        // Sync manufacturer and office/location if set on inventory item
        if ($item->manufacturer_id !== null) {
            $payload['manufacturer_id'] = $item->manufacturer_id;
        }
        if ($item->office_id !== null) {
            $payload['office_id'] = $item->office_id;
        }
        if ($item->location_id !== null) {
            $payload['location_id'] = $item->location_id;
        }

        $item->asset->update($payload);
    }

    /**
     * @return array{0: array<string, mixed>, 1: bool}
     */
    private function normalizeClassificationData(array $data, bool $defaultTrackAsAsset): array
    {
        $trackAsAsset = (bool) ($data['track_as_asset'] ?? $defaultTrackAsAsset);
        unset($data['track_as_asset']);

        $classification = strtoupper((string) ($data['classification'] ?? ''));
        $itemNature = strtoupper((string) ($data['item_nature'] ?? ''));
        $legacyType = (string) ($data['type'] ?? '');

        // ── Validate & cast unit_cost ──────────────────────────────────────
        if (array_key_exists('unit_cost', $data)) {
            $data['unit_cost'] = InventoryClassificationService::castAndValidate($data['unit_cost']);
        }

        // ── Initial classification from legacy type / explicit value ───────
        if ($classification === '') {
            if ($legacyType === 'expendable') {
                $classification = self::CLASSIFICATION_SUPPLY;
            } elseif ($legacyType === 'non_expendable') {
                $classification = self::CLASSIFICATION_PPE;
            } else {
                $classification = $trackAsAsset ? self::CLASSIFICATION_PPE : self::CLASSIFICATION_SUPPLY;
            }
        }

        if (! in_array($classification, [self::CLASSIFICATION_PPE, self::CLASSIFICATION_SE, self::CLASSIFICATION_SUPPLY], true)) {
            throw new \InvalidArgumentException("Invalid classification '{$classification}'.");
        }

        // ── Price-driven PPE/SE auto-classification ────────────────────────
        // Applies to accountable (non-SUPPLY) items whenever unit_cost is present
        // in the incoming payload (including explicit null/zero — those clear the
        // classification so the record is not left with a stale PPE/SE value).
        if (array_key_exists('unit_cost', $data) && InventoryClassificationService::shouldClassifyByPrice($classification)) {
            $unitCost = $data['unit_cost']; // may be null or 0.0 after castAndValidate
            $priceResult = InventoryClassificationService::classify($unitCost);

            if ($priceResult['classification'] !== null) {
                // Valid price → set PPE or SE
                $classification = $priceResult['classification'];
                $data['classification_reason'] = $priceResult['classification_reason'];
            } else {
                // null/zero price → clear classification; do NOT leave stale PPE/SE
                $classification = null;
                $data['classification_reason'] = $priceResult['classification_reason'];
            }
        }

        // ── Resolve item_nature ────────────────────────────────────────────
        // null classification = manual review → item stays ACCOUNTABLE_PROPERTY
        // SUPPLY → CONSUMABLE_SUPPLY
        // PPE / SE → ACCOUNTABLE_PROPERTY
        if ($itemNature === '') {
            $itemNature = $classification === self::CLASSIFICATION_SUPPLY
                ? self::NATURE_CONSUMABLE
                : self::NATURE_ACCOUNTABLE;
        }

        if (! in_array($itemNature, [self::NATURE_ACCOUNTABLE, self::NATURE_CONSUMABLE], true)) {
            throw new \InvalidArgumentException("Invalid item nature '{$itemNature}'.");
        }

        // ── Enforce SUPPLY / CONSUMABLE → no asset tracking ───────────────
        if ($classification === self::CLASSIFICATION_SUPPLY || $itemNature === self::NATURE_CONSUMABLE) {
            $trackAsAsset = false;
            $data['type'] = 'expendable';
        } else {
            // PPE, SE, or null (manual review) → non_expendable accountable item
            $data['type'] = 'non_expendable';
        }

        $data['classification'] = $classification;  // null = manual review required
        $data['item_nature'] = $itemNature;

        return [$data, $trackAsAsset];
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

    private function notifyStockThresholds(InventoryItem $item): void
    {
        if ($item->quantity <= 0) {
            $this->notificationService->notifyStaffAndAdmins(
                'Inventory Out of Stock',
                "{$item->name} is out of stock.",
                'inventory_out_of_stock',
                $item->id,
                InventoryItem::class,
                ['link' => '/inventory', 'sku' => $item->sku, 'quantity' => $item->quantity],
            );

            return;
        }

        if ($item->reorder_level !== null && $item->quantity <= $item->reorder_level) {
            $this->notificationService->notifyStaffAndAdmins(
                'Inventory Low Stock',
                "{$item->name} is low on stock ({$item->quantity} remaining; reorder at {$item->reorder_level}).",
                'inventory_low_stock',
                $item->id,
                InventoryItem::class,
                ['link' => '/inventory', 'sku' => $item->sku, 'quantity' => $item->quantity],
            );
        }
    }
}
