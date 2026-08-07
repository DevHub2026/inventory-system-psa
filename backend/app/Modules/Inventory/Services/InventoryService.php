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
            ->with(['asset.issuedToUser', 'unit', 'manufacturer', 'office', 'location', 'assetCategory'])
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
                // ── INVENTORY-OWNED fields ─────────────────────────────────
                'id'               => $item->id,
                'classification'   => $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')),
                'item_name'        => $item->name,
                'sku'              => $item->sku ?? '',
                'description'      => $item->description ?? '',
                'unit'             => $item->unit?->name ?? $item->unit ?? '',
                'manufacturer'     => $item->manufacturer?->name ?? '',
                'model'            => $item->model ?? '',
                'asset_category'   => $item->assetCategory?->name ?? ($item->asset?->category?->name ?? ''),
                'default_office'   => $item->office?->name ?? '',
                'default_location' => $item->location?->name ?? '',
                'quantity'         => $item->quantity,
                'reorder_level'    => $item->reorder_level ?? '',
                'stock_status'     => match (true) {
                    $item->quantity <= 0 => 'Out of Stock',
                    $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'Low Stock',
                    default => 'In Stock',
                },
                'unit_cost'        => $item->unit_cost !== null ? (float) $item->unit_cost : '',
                'is_borrowable'    => ($item->is_borrowable ?? true) ? 'Yes' : 'No',
                'remarks'          => $item->remarks ?? '',
                // ── ASSET-REFERENCE fields (read-only, labeled clearly) ────
                'asset_number'     => $item->asset?->asset_number ?? '',
                'property_number'  => $item->asset?->property_number ?? '',
                'asset_status'     => ($item->asset?->status instanceof \App\Modules\Asset\Enums\AssetStatus
                                        ? $item->asset->status->value
                                        : ($item->asset?->status ?? '')),
                'accountability'   => $item->classification === self::CLASSIFICATION_SUPPLY
                    ? '—'
                    : ($item->asset?->issued_to_user_id
                        ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                        : (filled($item->asset?->issued_to) ? 'Issued to '.$item->asset?->issued_to : 'Unassigned')),
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

        // ── SECTION A: Inventory-owned columns (cols A–P) ─────────────────
        // ── SECTION B: Asset-reference columns (cols Q–T, labeled clearly) ─
        $headers = [
            // Inventory-owned
            'A' => 'ID',
            'B' => 'Inventory Type',
            'C' => 'Item Name',
            'D' => 'SKU / Item Code',
            'E' => 'Description',
            'F' => 'Unit of Measure',
            'G' => 'Manufacturer',
            'H' => 'Model Number',
            'I' => 'Asset Category',
            'J' => 'Default Office',
            'K' => 'Default Location',
            'L' => 'Quantity',
            'M' => 'Low Stock Alert',
            'N' => 'Stock Status',
            'O' => 'Unit Cost (₱)',
            'P' => 'Borrowable',
            'Q' => 'Inventory Remarks',
            // Asset-reference (read-only, clearly labeled)
            'R' => '[Asset] Asset Number',
            'S' => '[Asset] Property Number',
            'T' => '[Asset] Asset Status',
            'U' => '[Asset] Accountability',
            'V' => 'Created At',
            'W' => 'Updated At',
        ];

        foreach ($headers as $col => $header) {
            $sheet->setCellValue($col.'1', $header);
            $sheet->getStyle($col.'1')->getFont()->setBold(true);
            // Light blue for inventory-owned headers, light grey for asset-reference
            $fillColor = str_starts_with($header, '[Asset]') ? 'F1F5F9' : 'EFF6FF';
            $sheet->getStyle($col.'1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB($fillColor);
        }

        // Data rows
        $row = 2;
        foreach ($items as $item) {
            $stockStatus = match (true) {
                $item->quantity <= 0 => 'Out of Stock',
                $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'Low Stock',
                default => 'In Stock',
            };

            $assetStatus = $item->asset?->status instanceof \App\Modules\Asset\Enums\AssetStatus
                ? $item->asset->status->value
                : ($item->asset?->status ?? '');

            $accountability = $item->classification === self::CLASSIFICATION_SUPPLY
                ? '—'
                : ($item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : (filled($item->asset?->issued_to) ? 'Issued to '.$item->asset?->issued_to : 'Unassigned'));

            // Inventory-owned
            $sheet->setCellValue('A'.$row, $item->id);
            $sheet->setCellValue('B'.$row, $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')));
            $sheet->setCellValue('C'.$row, $item->name);
            $sheet->setCellValue('D'.$row, $item->sku ?? '');
            $sheet->setCellValue('E'.$row, $item->description ?? '');
            $sheet->setCellValue('F'.$row, $item->unit?->name ?? $item->unit ?? '');
            $sheet->setCellValue('G'.$row, $item->manufacturer?->name ?? '');
            $sheet->setCellValue('H'.$row, $item->model ?? '');
            $sheet->setCellValue('I'.$row, $item->assetCategory?->name ?? ($item->asset?->category?->name ?? ''));
            $sheet->setCellValue('J'.$row, $item->office?->name ?? '');
            $sheet->setCellValue('K'.$row, $item->location?->name ?? '');
            $sheet->setCellValue('L'.$row, $item->quantity);
            $sheet->setCellValue('M'.$row, $item->reorder_level ?? '');
            $sheet->setCellValue('N'.$row, $stockStatus);
            $sheet->setCellValue('O'.$row, $item->unit_cost !== null ? (float) $item->unit_cost : '');
            $sheet->setCellValue('P'.$row, ($item->is_borrowable ?? true) ? 'Yes' : 'No');
            $sheet->setCellValue('Q'.$row, $item->remarks ?? '');
            // Asset-reference (read-only display)
            $sheet->setCellValue('R'.$row, $item->asset?->asset_number ?? '');
            $sheet->setCellValue('S'.$row, $item->asset?->property_number ?? '');
            $sheet->setCellValue('T'.$row, $assetStatus);
            $sheet->setCellValue('U'.$row, $accountability);
            $sheet->setCellValue('V'.$row, $item->created_at?->format('Y-m-d H:i:s') ?? '');
            $sheet->setCellValue('W'.$row, $item->updated_at?->format('Y-m-d H:i:s') ?? '');
            $row++;
        }

        foreach (range('A', 'W') as $col) {
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
        $query = InventoryItem::query()->with(['asset.issuedToUser', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier']);

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
            // ── Extract INITIAL-ASSET-ONLY fields ─────────────────────────
            // model, description, asset_category_id live on BOTH inventory_items
            // (as inventory-owned truth) AND are copied to the linked asset at
            // creation as initial values.  We do NOT extract them from $data here;
            // InventoryItem::create($data) will persist them directly.
            // We separately build the $initialAssetFields for createAssetForInventoryItem.
            $initialAssetFields = [];
            foreach (['model', 'description', 'asset_category_id'] as $field) {
                if (array_key_exists($field, $data)) {
                    $initialAssetFields[$field] = $data[$field];
                    // Keep in $data so InventoryItem::create saves them
                }
            }

            [$data, $trackAsAsset] = $this->normalizeClassificationData($data, true);

            // SUPPLY items are never borrowable
            if (($data['classification'] ?? '') === self::CLASSIFICATION_SUPPLY) {
                $data['is_borrowable'] = false;
            } elseif (! array_key_exists('is_borrowable', $data)) {
                $data['is_borrowable'] = true;
            }

            // $data now contains track_as_asset (persisted by normalizeClassificationData).
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
                // Build the initial Asset payload.
                // office_id and location_id come from the InventoryItem record
                // (stored as "Default Office/Location") and are used ONCE at
                // creation.  syncLinkedAsset() will never overwrite them again.
                $assetPayload = [
                    'description'      => $initialAssetFields['description']
                                          ?? 'Linked from inventory item #'.$item->id.'.',
                    'model'            => $initialAssetFields['model'] ?? null,
                    'asset_category_id' => $initialAssetFields['asset_category_id'] ?? null,
                    // Initial condition defaults to GOOD; asset owner can change it later
                    'condition_status' => ConditionStatus::GOOD->value,
                ];

                $asset = $this->createAssetForInventoryItem($item, $assetPayload);
                // Persist both asset_id and track_as_asset = true so the column
                // accurately reflects the active tracked state.
                $item->update(['asset_id' => $asset->id, 'track_as_asset' => true]);
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
        // Default to the persisted column value, not (bool) $item->asset_id.
        // This ensures a deliberate track_as_asset = false is honoured even when
        // an asset_id already exists (i.e. the asset is hidden, not deleted).
        $classificationPayload['track_as_asset'] ??= (bool) $item->track_as_asset;

        // ── Extract inventory-shared fields that may update the linked Asset ─
        // These are fields that Inventory owns and that the linked Asset should
        // also reflect when changed (model, description, asset_category_id).
        // They remain in $classificationPayload so $item->update() saves them
        // on inventory_items; we also keep a separate copy for the asset sync.
        //
        // Asset-OWNED fields are NOT extracted here:
        //   condition_status  → only editable from Asset module
        //   property_number   → only editable from Asset module
        $assetLevelFields = [];
        foreach (['model', 'description', 'asset_category_id'] as $field) {
            if (array_key_exists($field, $data)) {
                $assetLevelFields[$field] = $data[$field];
                unset($classificationPayload[$field]); // removed so normalizeClassificationData skips it
            }
        }

        // Handle is_borrowable — if SUPPLY, force false
        if (array_key_exists('is_borrowable', $classificationPayload)) {
            $classificationPayload['is_borrowable'] = (bool) $classificationPayload['is_borrowable'];
        }

        [$data, $trackAsAsset] = $this->normalizeClassificationData($classificationPayload, (bool) $item->track_as_asset);

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

        // Re-add the inventory-shared fields so they are saved on inventory_items too
        if (! empty($assetLevelFields)) {
            $item->update($assetLevelFields);
        }

        // ── track_as_asset toggle ─────────────────────────────────────────
        // Turning ON (true) when no asset exists yet → create one.
        // Turning ON when an asset exists but was hidden → simply re-exposing it
        //   (track_as_asset = true was already saved by $item->update($data) above).
        // Turning OFF → asset_id is preserved (not nulled); the column flag does
        //   the hiding. History, audit, maintenance all remain intact.
        if ($trackAsAsset && ! $item->asset_id) {
            $asset = $this->createAssetForInventoryItem($item->fresh());
            $item->update(['asset_id' => $asset->id]);
        }

        // Apply inventory-shared field updates to the linked Asset.
        // Only model, description, asset_category_id are allowed here.
        // office_id, location_id, manufacturer_id are NOT pushed to the asset
        // on update — changing them in Inventory must not silently move an
        // existing asset to a new office/location.
        if (! empty($assetLevelFields) && $item->asset_id) {
            $item->load('asset');
            if ($item->asset) {
                $item->asset->update($assetLevelFields);
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
            // Use the inventory item's FK values as initial defaults.
            // These are only written at Asset creation — syncLinkedAsset()
            // will NOT overwrite them on subsequent Inventory edits.
            'asset_category_id' => $this->defaultInventoryCategory()->id,
            'office_id'         => $item->office_id ?? $this->defaultOffice()->id,
            'location_id'       => $item->location_id,
            'manufacturer_id'   => $item->manufacturer_id,
            'status'            => $item->quantity > 0 ? AssetStatus::AVAILABLE->value : AssetStatus::UNAVAILABLE->value,
            'condition_status'  => ConditionStatus::GOOD->value,
            'remarks'           => $item->remarks,
            // Procurement values are inherited from Inventory at creation only.
            // The Asset displays them read-only; Inventory is the source of truth.
            'purchase_date'     => $item->purchase_date,
            'warranty_until'    => $item->warranty_until,
        ];

        // additionalPayload overrides base (e.g. model, description, asset_category_id).
        // Never allow asset_number to be overridden from outside.
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

        // Sync only fields that Inventory authoritatively owns and that should
        // always stay in sync with the linked Asset:
        //   name   — the item name is the same for the Asset
        //   status — derived from stock quantity (available vs unavailable)
        //   remarks — inventory-level remarks mirror to the asset
        //
        // NOT synced here (asset-specific, editable only from Asset module):
        //   manufacturer_id  — synced at creation only
        //   office_id        — synced at creation only ("Default Office")
        //   location_id      — synced at creation only ("Default Location")
        //   condition_status — asset-owned
        //   property_number  — asset-owned
        $item->asset->update([
            'name'    => $item->name,
            'status'  => $item->quantity > 0
                ? AssetStatus::AVAILABLE->value
                : AssetStatus::UNAVAILABLE->value,
            'remarks' => $item->remarks,
        ]);
    }

    /**
     * @return array{0: array<string, mixed>, 1: bool}
     */
    private function normalizeClassificationData(array $data, bool $defaultTrackAsAsset): array
    {
        $trackAsAsset = (bool) ($data['track_as_asset'] ?? $defaultTrackAsAsset);
        // Do NOT unset — we persist it to the column so Asset queries can filter by it.

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

        $data['classification']  = $classification;  // null = manual review required
        $data['item_nature']     = $itemNature;
        // Persist the resolved flag so Asset Management queries can filter by it.
        $data['track_as_asset']  = $trackAsAsset;

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
