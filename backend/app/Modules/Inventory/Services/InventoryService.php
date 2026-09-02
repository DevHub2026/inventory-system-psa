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
use App\Modules\Inventory\Models\InventoryCountSession;
use App\Modules\Inventory\Models\StockTransaction;
use App\Modules\Inventory\Services\InventoryClassificationService;
use App\Modules\Notification\Services\NotificationService;
use App\Modules\Unit\Models\Unit;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Services\TemplateRenderingService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        $requestedColumns = $this->resolveExportColumns($filters);

        $items = InventoryItem::query()
            ->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'itemType'])
            ->when(! empty($filters['classification']), function ($query) use ($filters) {
                $query->where('classification', $filters['classification']);
            })
            ->when(! empty($filters['type']), function ($query) use ($filters) {
                $query->where('type', $filters['type']);
            })
            ->when(! empty($filters['item_type_id']), function ($query) use ($filters) {
                $query->where('item_type_id', $filters['item_type_id']);
            })
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->whereLikeInsensitive(['name', 'sku', 'unit'], $search)
                        ->orWhereHas('unit', function ($q) use ($search) {
                            $q->whereLikeInsensitive(['name'], $search);
                        })
                        ->orWhereHas('asset', function ($aq) use ($search) {
                            $aq->whereLikeInsensitive(['asset_number', 'property_number', 'name'], $search)
                               ->orWhereHas('identifiers', function ($idq) use ($search) {
                                    $idq->whereLikeInsensitive(['identifier_value'], $search);
                               })
                               ->orWhereHas('manufacturer', function ($m) use ($search) {
                                    $m->whereLikeInsensitive(['name'], $search);
                               });
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
            ->when(! empty($filters['asset_category_id']), function ($q) use ($filters) { $q->where('asset_category_id', $filters['asset_category_id']); })
            ->when(! empty($filters['office_id']), function ($q) use ($filters) { $q->where('office_id', $filters['office_id']); })
            ->when(! empty($filters['location_id']), function ($q) use ($filters) { $q->where('location_id', $filters['location_id']); })
            ->when(! empty($filters['manufacturer_id']), function ($q) use ($filters) { $q->where('manufacturer_id', $filters['manufacturer_id']); })
            ->when(! empty($filters['assigned_user_id']), function ($q) use ($filters) { $q->whereHas('asset', fn($aq) => $aq->where('issued_to_user_id', $filters['assigned_user_id'])); })
            ->when(! empty($filters['created_from']), function ($q) use ($filters) { $q->whereDate('created_at', '>=', $filters['created_from']); })
            ->when(! empty($filters['created_to']), function ($q) use ($filters) { $q->whereDate('created_at', '<=', $filters['created_to']); })
            ->orderByDesc('created_at')
            ->get();

        $exportColumns = $this->exportColumnMap();
        $defaultColumns = ['inventory_type', 'item_name', 'sku', 'description', 'unit', 'manufacturer', 'model', 'asset_category', 'default_office', 'default_location', 'quantity', 'reorder_level', 'stock_status', 'unit_cost', 'is_borrowable', 'remarks'];
        $visibleColumns = $requestedColumns !== [] ? $requestedColumns : $defaultColumns;

        // Try to use a configured template first
        if ($this->templateRenderingService !== null) {
            $documentType = $format === 'csv' ? DocumentType::CSV_EXPORT : DocumentType::EXCEL_EXPORT;
            $rows = $items->map(function ($item) use ($visibleColumns, $exportColumns) {
                $row = [];
                foreach ($visibleColumns as $columnKey) {
                    $row[$columnKey] = $this->exportValueForColumn($item, $columnKey);
                }

                return $row;
            })->toArray();

            $result = $this->templateRenderingService->renderReport($documentType, [], $rows, $format);

            if ($result !== null) {
                return $result['path'];
            }
        }

        // Fall back to hardcoded generation
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventory Export');

        $headers = [];
        $columnLetters = range('A', 'Z');
        foreach ($visibleColumns as $index => $columnKey) {
            $columnLetter = $columnLetters[$index] ?? 'Z';
            $headers[$columnLetter] = $exportColumns[$columnKey]['label'];
        }

        foreach ($headers as $col => $header) {
            $sheet->setCellValue($col.'1', $header);
            $sheet->getStyle($col.'1')->getFont()->setBold(true);
            $fillColor = 'EFF6FF';
            $sheet->getStyle($col.'1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB($fillColor);
        }

        $row = 2;
        foreach ($items as $item) {
            foreach ($visibleColumns as $index => $columnKey) {
                $columnLetter = $columnLetters[$index] ?? 'Z';
                $sheet->setCellValue($columnLetter.$row, $this->exportValueForColumn($item, $columnKey));
            }
            $row++;
        }

        foreach (range('A', $columnLetters[min(count($visibleColumns) - 1, count($columnLetters) - 1)]) as $col) {
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

    private function resolveExportColumns(array $filters): array
    {
        $payload = $filters['columns'] ?? $filters['selected_columns'] ?? $filters['export_columns'] ?? [];

        if (is_string($payload)) {
            $payload = preg_split('/[,|]/', $payload) ?: [];
        }

        if (! is_array($payload)) {
            return [];
        }

        $keyMap = [
            'id' => 'id',
            'name' => 'item_name',
            'item_name' => 'item_name',
            'sku' => 'sku',
            'type' => 'inventory_type',
            'classification' => 'inventory_type',
            'inventory_type' => 'inventory_type',
            'description' => 'description',
            'unit' => 'unit',
            'manufacturer' => 'manufacturer',
            'model' => 'model',
            'asset_category' => 'asset_category',
            'default_office' => 'default_office',
            'default_location' => 'default_location',
            'quantity' => 'quantity',
            'reorder_level' => 'reorder_level',
            'status' => 'stock_status',
            'stock_status' => 'stock_status',
            'unit_cost' => 'unit_cost',
            'is_borrowable' => 'is_borrowable',
            'remarks' => 'remarks',
            'property_number' => 'property_number',
            'asset_number' => 'asset_number',
            'serial_number' => 'serial_number',
            'accountability' => 'accountability',
        ];

        $allowedKeys = array_keys($this->exportColumnMap());
        $normalized = array_map('trim', $payload);
        $normalized = array_filter($normalized, fn ($value) => $value !== '');
        $normalized = array_values(array_unique($normalized));

        $resolved = [];
        foreach ($normalized as $value) {
            $mappedKey = $keyMap[$value] ?? $value;
            if (in_array($mappedKey, $allowedKeys, true)) {
                $resolved[] = $mappedKey;
            }
        }

        return array_values(array_unique($resolved));
    }

    private function exportColumnMap(): array
    {
        return [
            'id' => ['label' => 'ID', 'value' => fn ($item) => $item->id],
            'inventory_type' => ['label' => 'Inventory Type', 'value' => fn ($item) => $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? ''))],
            'item_name' => ['label' => 'Item Name', 'value' => fn ($item) => $item->name],
            'sku' => ['label' => 'SKU / Item Code', 'value' => fn ($item) => $item->sku ?? ''],
            'description' => ['label' => 'Description', 'value' => fn ($item) => $item->description ?? ''],
            'unit' => ['label' => 'Unit of Measure', 'value' => fn ($item) => $item->unit?->name ?? $item->unit ?? ''],
            'manufacturer' => ['label' => 'Manufacturer', 'value' => fn ($item) => $item->manufacturer?->name ?? ''],
            'model' => ['label' => 'Model Number', 'value' => fn ($item) => $item->model ?? ''],
            'asset_category' => ['label' => 'Asset Category', 'value' => fn ($item) => $item->assetCategory?->name ?? ($item->asset?->category?->name ?? '')],
            'default_office' => ['label' => 'Default Office', 'value' => fn ($item) => $item->office?->name ?? ''],
            'default_location' => ['label' => 'Default Location', 'value' => fn ($item) => $item->location?->name ?? ''],
            'quantity' => ['label' => 'Quantity', 'value' => fn ($item) => $item->quantity],
            'reorder_level' => ['label' => 'Low Stock Alert', 'value' => fn ($item) => $item->reorder_level ?? ''],
            'stock_status' => ['label' => 'Stock Status', 'value' => fn ($item) => match (true) {
                $item->quantity <= 0 => 'Out of Stock',
                $item->reorder_level !== null && $item->quantity <= $item->reorder_level => 'Low Stock',
                default => 'In Stock',
            }],
            'unit_cost' => ['label' => 'Unit Cost (₱)', 'value' => fn ($item) => $item->unit_cost !== null ? (float) $item->unit_cost : ''],
            'is_borrowable' => ['label' => 'Borrowable', 'value' => fn ($item) => ($item->is_borrowable ?? true) ? 'Yes' : 'No'],
            'remarks' => ['label' => 'Inventory Remarks', 'value' => fn ($item) => $item->remarks ?? ''],
            'asset_number' => ['label' => '[Asset] Asset Number', 'value' => fn ($item) => $item->asset?->asset_number ?? ''],
            'property_number' => ['label' => '[Asset] Property Number', 'value' => fn ($item) => $item->asset?->property_number ?? ''],
            'serial_number' => ['label' => '[Asset] Serial Number', 'value' => fn ($item) => $item->asset?->identifiers?->firstWhere('identifier_type', 'SERIAL_NUMBER')?->identifier_value ?? ''],
            'accountability' => ['label' => '[Asset] Accountability', 'value' => fn ($item) => $item->classification === self::CLASSIFICATION_SUPPLY
                ? '—'
                : ($item->asset?->issued_to_user_id
                    ? 'Issued to '.($item->asset?->issuedToUser?->full_name ?? $item->asset?->issued_to ?? 'N/A')
                    : (filled($item->asset?->issued_to) ? 'Issued to '.$item->asset?->issued_to : 'Unassigned'))],
        ];
    }

    private function exportValueForColumn(InventoryItem $item, string $columnKey): mixed
    {
        $columnMap = $this->exportColumnMap();
        $definition = $columnMap[$columnKey] ?? null;

        if ($definition === null) {
            return '';
        }

        return ($definition['value'])($item);
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
        $query = InventoryItem::query()->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier', 'itemType']);

        if (! empty($filters['classification'])) {
            $query->where('classification', $filters['classification']);
        }

        // Filter by inventory type (non_expendable / expendable)
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['item_type_id'])) {
            $query->where('item_type_id', $filters['item_type_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            // Centralized case-insensitive LIKE helper (whereLikeInsensitive) is used
            // to keep behavior consistent across DB engines.
            $query->where(function ($q) use ($search): void {
                $q->whereLikeInsensitive(['name', 'sku', 'unit'], $search)
                    ->orWhereHas('unit', function ($uq) use ($search) {
                        $uq->whereLikeInsensitive(['name'], $search);
                    })
                    // Search linked asset fields (asset_number, property_number) and identifiers (serial)
                    ->orWhereHas('asset', function ($aq) use ($search) {
                        $aq->whereLikeInsensitive(['asset_number', 'property_number', 'name'], $search)
                           ->orWhereHas('identifiers', function ($idq) use ($search) {
                               $idq->whereLikeInsensitive(['identifier_value'], $search);
                           })
                           ->orWhereHas('manufacturer', function ($m) use ($search) {
                               $m->whereLikeInsensitive(['name'], $search);
                           });
                    });
            });
        }

        // Additional server-side filters
        if (! empty($filters['asset_category_id'])) {
            $query->where('asset_category_id', $filters['asset_category_id']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (! empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (! empty($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        if (! empty($filters['assigned_user_id'])) {
            // assigned_user corresponds to linked asset.issued_to_user_id
            $query->whereHas('asset', function ($aq) use ($filters) {
                $aq->where('issued_to_user_id', $filters['assigned_user_id']);
            });
        }

        if (! empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (! empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        // Ordering — whitelist mapping
        $orderByMap = [
            'name' => 'inventory_items.name',
            'created_at' => 'inventory_items.created_at',
            'quantity' => 'inventory_items.quantity',
        ];

        $orderBy = $filters['order_by'] ?? null;
        $orderDir = strtoupper($filters['order_dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        if ($orderBy !== null && array_key_exists($orderBy, $orderByMap)) {
            $query->orderBy($orderByMap[$orderBy], $orderDir);
        } else {
            $query->orderByDesc('created_at');
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
                // Asset-level disposed status — filter by linked asset.status
                'DISPOSED' => $query->whereHas('asset', function ($aq) {
                    $aq->where('status', AssetStatus::DISPOSED->value);
                }),
                default => null,
            };
        } elseif (isset($filters['low_stock'])) {
            $query->where('quantity', '>', 0)->whereColumn('quantity', '<=', 'reorder_level');
        }

        return $query->paginate(min(max($perPage, 1), 100));
    }

    public function create(array $data, ?User $user = null): InventoryItem
    {
        // Enforce authorization at the service boundary as a safety net.
        // This ensures that even if FormRequest authorize() is bypassed for
        // any reason, category-level rules are enforced centrally.
        try {
            if ($user !== null) {
                $policy = app(\App\Policies\InventoryItemPolicy::class);
                if (! $policy->create($user, $data['classification'] ?? null)) {
                    abort(403, 'Unauthorized to create inventory item for this classification.');
                }
            }
        } catch (\Throwable $e) {
            // Fail closed
            abort(403, 'Unauthorized to create inventory item.');
        }

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

            // ── Extract identifier fields (not stored on inventory_items) ──
            $propertyNumber = array_key_exists('property_number', $data) ? $data['property_number'] : null;
            $serialNumber   = array_key_exists('serial_number', $data)   ? $data['serial_number']   : null;
            unset($data['property_number'], $data['serial_number']);

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

                // Set property_number on the asset at creation if provided
                if (filled($propertyNumber)) {
                    $assetPayload['property_number'] = $propertyNumber;
                }

                $asset = $this->createAssetForInventoryItem($item, $assetPayload);
                // Persist both asset_id and track_as_asset = true so the column
                // accurately reflects the active tracked state.
                $item->update(['asset_id' => $asset->id, 'track_as_asset' => true]);

                // Sync serial number identifier if provided
                if (filled($serialNumber)) {
                    $this->syncSerialNumber($asset, $serialNumber);
                }
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

        // ── Extract identifier fields (not stored on inventory_items) ──────
        // property_number → assets.property_number (asset-owned column)
        // serial_number   → asset_identifiers(SERIAL_NUMBER) row
        $propertyNumber     = array_key_exists('property_number', $classificationPayload)
            ? $classificationPayload['property_number']
            : false; // false = not present in this request (do not touch)
        $serialNumber       = array_key_exists('serial_number', $classificationPayload)
            ? $classificationPayload['serial_number']
            : false;
        unset($classificationPayload['property_number'], $classificationPayload['serial_number']);

        // ── Extract inventory-shared fields that may update the linked Asset ─
        // These are fields that Inventory owns and that the linked Asset should
        // also reflect when changed (model, description, asset_category_id).
        // They remain in $classificationPayload so $item->update() saves them
        // on inventory_items; we also keep a separate copy for the asset sync.
        //
        // Asset-OWNED fields are NOT extracted here:
        //   condition_status  → only editable from Asset module
        $assetLevelFields = [];
        foreach (['model', 'description', 'asset_category_id'] as $field) {
            if (array_key_exists($field, $classificationPayload)) {
                $assetLevelFields[$field] = $classificationPayload[$field];
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

        // ── Sync identifier fields to the linked Asset ────────────────────
        // Only touch these if they were present in the incoming request.
        if ($item->asset_id) {
            $item->load('asset');
            if ($item->asset) {
                if ($propertyNumber !== false) {
                    $item->asset->update(['property_number' => $propertyNumber ?: null]);
                }
                if ($serialNumber !== false) {
                    $this->syncSerialNumber($item->asset, $serialNumber ?: null);
                }
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

    public function transfer(
        InventoryItem $item,
        int $quantity,
        int $sourceLocationId,
        int $destinationLocationId,
        ?string $reason = null,
        ?User $user = null,
    ): array {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Transfer quantity must be greater than zero.');
        }

        if ($sourceLocationId === $destinationLocationId) {
            throw new \InvalidArgumentException('Source and destination locations must be different.');
        }

        $sourceExists = Location::query()->whereKey($sourceLocationId)->exists();
        $destinationExists = Location::query()->whereKey($destinationLocationId)->exists();

        if (! $sourceExists || ! $destinationExists) {
            throw new \InvalidArgumentException('Source or destination location is invalid.');
        }

        return DB::transaction(function () use ($item, $quantity, $sourceLocationId, $destinationLocationId, $reason, $user): array {
            $source = InventoryItem::query()->lockForUpdate()->findOrFail($item->id);

            if ((int) $source->location_id !== $sourceLocationId) {
                throw new \InvalidArgumentException('The selected source location does not match the inventory item location.');
            }

            if ($source->quantity < $quantity) {
                throw new \InvalidArgumentException('Cannot transfer more stock than available.');
            }

            $transferUuid = (string) Str::uuid();
            $sourceBefore = (int) $source->quantity;

            if ($quantity === $sourceBefore) {
                $source->update(['location_id' => $destinationLocationId]);

                $this->recordMovement($source, 'transfer', 0, $sourceBefore, $sourceBefore, $reason, $user, [
                    'source_location_id' => $sourceLocationId,
                    'destination_location_id' => $destinationLocationId,
                    'related_inventory_item_id' => $source->id,
                    'transfer_uuid' => $transferUuid,
                    'remarks' => 'Full-location transfer',
                ]);

                return [
                    'transfer_uuid' => $transferUuid,
                    'source_item' => $source->fresh(['asset', 'location']),
                    'destination_item' => $source->fresh(['asset', 'location']),
                ];
            }

            $destination = InventoryItem::query()
                ->where('location_id', $destinationLocationId)
                ->where('name', $source->name)
                ->where('unit_id', $source->unit_id)
                ->where('classification', $source->classification)
                ->lockForUpdate()
                ->first();

            if (! $destination) {
                $destination = $source->replicate([
                    'asset_id',
                    'sku',
                    'quantity',
                    'track_as_asset',
                    'created_at',
                    'updated_at',
                    'deleted_at',
                ]);
                $destination->fill([
                    'asset_id' => null,
                    'sku' => null,
                    'quantity' => 0,
                    'location_id' => $destinationLocationId,
                    'track_as_asset' => false,
                ]);
                $destination->save();
            }

            $destinationBefore = (int) $destination->quantity;
            $sourceAfter = $sourceBefore - $quantity;
            $destinationAfter = $destinationBefore + $quantity;

            $source->update(['quantity' => $sourceAfter]);
            $destination->update(['quantity' => $destinationAfter]);

            $this->recordMovement($source, 'transfer_out', -$quantity, $sourceBefore, $sourceAfter, $reason, $user, [
                'source_location_id' => $sourceLocationId,
                'destination_location_id' => $destinationLocationId,
                'related_inventory_item_id' => $destination->id,
                'transfer_uuid' => $transferUuid,
            ]);
            $this->recordMovement($destination, 'transfer_in', $quantity, $destinationBefore, $destinationAfter, $reason, $user, [
                'source_location_id' => $sourceLocationId,
                'destination_location_id' => $destinationLocationId,
                'related_inventory_item_id' => $source->id,
                'transfer_uuid' => $transferUuid,
            ]);

            $this->syncLinkedAsset($source->fresh('asset'));
            $this->notifyStockThresholds($source->fresh());

            return [
                'transfer_uuid' => $transferUuid,
                'source_item' => $source->fresh(['asset', 'location']),
                'destination_item' => $destination->fresh(['asset', 'location']),
            ];
        });
    }

    public function createCountSession(array $data, User $user): InventoryCountSession
    {
        return DB::transaction(function () use ($data, $user): InventoryCountSession {
            $locationId = $data['location_id'] ?? null;
            $session = InventoryCountSession::query()->create([
                'location_id' => $locationId,
                'started_by' => $user->id,
                'status' => 'draft',
                'counted_at' => $data['counted_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $items = InventoryItem::query()
                ->when($locationId, fn ($query) => $query->where('location_id', $locationId))
                ->orderBy('name')
                ->get();

            foreach ($items as $item) {
                $session->items()->create([
                    'inventory_item_id' => $item->id,
                    'expected_quantity' => (int) $item->quantity,
                    'variance' => 0,
                ]);
            }

            return $session->fresh(['location', 'startedBy', 'items.inventoryItem']);
        });
    }

    public function recordCount(InventoryCountSession $session, InventoryItem $item, int $actualQuantity, ?string $remarks, User $user): InventoryCountSession
    {
        if ($session->status !== 'draft') {
            throw new \InvalidArgumentException('Only draft count sessions can be updated.');
        }

        if ($actualQuantity < 0) {
            throw new \InvalidArgumentException('Actual quantity cannot be negative.');
        }

        $countItem = $session->items()->where('inventory_item_id', $item->id)->firstOrFail();
        $variance = $actualQuantity - (int) $countItem->expected_quantity;

        $countItem->update([
            'actual_quantity' => $actualQuantity,
            'variance' => $variance,
            'remarks' => $remarks,
            'counted_at' => now(),
            'counted_by' => $user->id,
        ]);

        return $session->fresh(['location', 'startedBy', 'items.inventoryItem', 'items.countedBy']);
    }

    public function completeCountSession(InventoryCountSession $session, User $user): InventoryCountSession
    {
        if ($session->status !== 'draft') {
            throw new \InvalidArgumentException('Only draft count sessions can be completed.');
        }

        if ($session->items()->whereNull('actual_quantity')->exists()) {
            throw new \InvalidArgumentException('All count items must have an actual quantity before completion.');
        }

        $session->update([
            'status' => 'completed',
            'completed_by' => $user->id,
            'completed_at' => now(),
        ]);

        return $session->fresh(['location', 'startedBy', 'completedBy', 'items.inventoryItem', 'items.countedBy']);
    }

    public function reconcileCountSession(InventoryCountSession $session, User $user): InventoryCountSession
    {
        if ($session->status !== 'completed') {
            throw new \InvalidArgumentException('Only completed count sessions can be reconciled.');
        }

        return DB::transaction(function () use ($session, $user): InventoryCountSession {
            $session->load('items.inventoryItem');

            foreach ($session->items as $countItem) {
                if ((int) $countItem->variance === 0 || $countItem->reconciliation_transaction_id) {
                    continue;
                }

                $item = InventoryItem::query()->lockForUpdate()->findOrFail($countItem->inventory_item_id);
                $before = (int) $item->quantity;
                $after = (int) $countItem->actual_quantity;

                $item->update(['quantity' => $after]);
                $transaction = StockTransaction::query()->create([
                    'inventory_item_id' => $item->id,
                    'type' => 'cycle_count_adjustment',
                    'quantity' => $after - $before,
                    'quantity_before' => $before,
                    'quantity_after' => $after,
                    'user_id' => $user->id,
                    'reason' => "Inventory count session #{$session->id} reconciliation",
                    'remarks' => $countItem->remarks,
                ]);

                $countItem->update(['reconciliation_transaction_id' => $transaction->id]);
                $this->syncLinkedAsset($item->fresh('asset'));
                $this->notifyStockThresholds($item->fresh());
            }

            $session->update([
                'status' => 'reconciled',
                'reconciled_by' => $user->id,
                'reconciled_at' => now(),
            ]);

            return $session->fresh(['location', 'startedBy', 'completedBy', 'reconciledBy', 'items.inventoryItem', 'items.countedBy']);
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
        array $metadata = [],
    ): void {
        StockTransaction::query()->create([
            'inventory_item_id' => $item->id,
            'type' => $type,
            'quantity' => $quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'user_id' => $user?->id ?? auth()->id(),
            'reason' => $reason,
            'source_location_id' => $metadata['source_location_id'] ?? null,
            'destination_location_id' => $metadata['destination_location_id'] ?? null,
            'related_inventory_item_id' => $metadata['related_inventory_item_id'] ?? null,
            'transfer_uuid' => $metadata['transfer_uuid'] ?? null,
            'remarks' => $metadata['remarks'] ?? null,
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

        // Preserve explicit null classification (client intends 'manual review').
        // Distinguish between:
        //  - key absent or empty string => defaulting behavior
        //  - key present with null => explicit request for manual review (classification = null)
        if (array_key_exists('classification', $data) && $data['classification'] === null) {
            $classification = null;
        } else {
            $classification = strtoupper((string) ($data['classification'] ?? ''));
        }

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

        // Allow explicit null (manual review) to pass through. Only validate when non-null.
        if ($classification !== null && ! in_array($classification, [self::CLASSIFICATION_PPE, self::CLASSIFICATION_SE, self::CLASSIFICATION_SUPPLY], true)) {
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

    /**
     * Sync a serial number to the linked Asset's AssetIdentifier record.
     *
     * - $value = non-empty string  → create or update the SERIAL_NUMBER identifier
     * - $value = null / ''         → delete the SERIAL_NUMBER identifier if it exists
     *
     * Only one SERIAL_NUMBER per asset is maintained (the first one found).
     * PSA_QR identifiers are never touched here.
     */
    private function syncSerialNumber(Asset $asset, ?string $value): void
    {
        $existing = AssetIdentifier::query()
            ->where('asset_id', $asset->id)
            ->where('identifier_type', IdentifierType::SERIAL_NUMBER->value)
            ->first();

        if (filled($value)) {
            if ($existing) {
                $existing->update(['identifier_value' => $value]);
            } else {
                AssetIdentifier::query()->create([
                    'asset_id'         => $asset->id,
                    'identifier_type'  => IdentifierType::SERIAL_NUMBER->value,
                    'identifier_value' => $value,
                    'is_primary'       => false,
                ]);
            }
        } else {
            // Clear the serial number
            if ($existing) {
                $existing->delete();
            }
        }
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
