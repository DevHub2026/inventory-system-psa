<?php

namespace App\Modules\Inventory\Services;

use App\Models\InventoryCategory;
use App\Models\InventoryCustomField;
use App\Models\InventoryImport;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;

class InventoryImportWizardService
{
    /**
     * System fields available for mapping.
     */
    public function getSystemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Item Name', 'required' => true, 'type' => 'text'],
            ['key' => 'sku', 'label' => 'SKU/Code', 'required' => false, 'type' => 'text'],
            ['key' => 'category_name', 'label' => 'Category', 'required' => false, 'type' => 'reference', 'reference_model' => InventoryCategory::class, 'reference_field' => 'name'],
            ['key' => 'unit', 'label' => 'Unit', 'required' => false, 'type' => 'text'],
            ['key' => 'quantity', 'label' => 'Quantity', 'required' => false, 'type' => 'number'],
            ['key' => 'reorder_level', 'label' => 'Reorder Level', 'required' => false, 'type' => 'number'],
            ['key' => 'remarks', 'label' => 'Remarks', 'required' => false, 'type' => 'text'],
        ];
    }

    /**
     * Step 1: Upload and parse Excel file.
     * Returns preview data without saving to database.
     */
    public function uploadAndParse(User $user, string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        if (count($rows) < 2) {
            throw new \InvalidArgumentException('The Excel file is empty or has no data rows.');
        }

        $headers = array_map('trim', $rows[0]);
        $dataRows = array_slice($rows, 1);

        // Detect empty columns
        $columnInfo = [];
        foreach ($headers as $colIndex => $header) {
            $nonEmptyCount = 0;
            $sampleValues = [];
            foreach ($dataRows as $row) {
                $val = trim((string) ($row[$colIndex] ?? ''));
                if ($val !== '') {
                    $nonEmptyCount++;
                    if (count($sampleValues) < 3) {
                        $sampleValues[] = $val;
                    }
                }
            }
            $columnInfo[] = [
                'index' => $colIndex,
                'header' => $header,
                'non_empty_count' => $nonEmptyCount,
                'sample_values' => $sampleValues,
                'is_empty' => $nonEmptyCount === 0,
            ];
        }

        // Detect duplicate headers
        $headerCounts = array_count_values($headers);
        $duplicateHeaders = array_filter($headerCounts, fn($c) => $c > 1);

        // Auto-suggest mappings
        $systemFields = $this->getSystemFields();
        $suggestedMappings = [];
        foreach ($columnInfo as $col) {
            $suggested = $this->suggestMapping($col['header'], $systemFields);
            $suggestedMappings[] = [
                'excel_column' => $col['header'],
                'excel_index' => $col['index'],
                'suggested_system_field' => $suggested,
                'is_empty' => $col['is_empty'],
                'sample_values' => $col['sample_values'],
            ];
        }

        // Store the file for later use
        $import = InventoryImport::create([
            'original_filename' => basename($filePath),
            'stored_path' => $filePath,
            'total_rows' => count($dataRows),
            'status' => 'pending',
            'created_by' => $user->id,
        ]);

        return [
            'import_id' => $import->id,
            'filename' => basename($filePath),
            'total_rows' => count($dataRows),
            'headers' => $headers,
            'preview_rows' => array_slice($dataRows, 0, 5),
            'columns' => $columnInfo,
            'duplicate_headers' => array_keys($duplicateHeaders),
            'suggested_mappings' => $suggestedMappings,
            'system_fields' => $systemFields,
            'custom_fields' => InventoryCustomField::query()->where('is_active', true)->get(['id', 'name', 'field_key', 'field_type']),
        ];
    }

    /**
     * Step 2-3: Validate column mapping and return validation results.
     */
    public function validateMapping(int $importId, array $columnMapping, array $customFieldsToCreate = []): array
    {
        $import = InventoryImport::findOrFail($importId);
        $systemFields = $this->getSystemFields();
        $errors = [];
        $warnings = [];
        $mappedFields = [];

        // Track which system fields are mapped
        $mappedSystemKeys = [];

        foreach ($columnMapping as $mapping) {
            $excelColumn = $mapping['excel_column'];
            $targetType = $mapping['target_type']; // 'system', 'custom', 'ignore'
            $targetKey = $mapping['target_key'] ?? null;

            if ($targetType === 'ignore') {
                continue;
            }

            if ($targetType === 'system' && $targetKey) {
                $mappedSystemKeys[] = $targetKey;
                $mappedFields[] = [
                    'excel_column' => $excelColumn,
                    'target' => collect($systemFields)->firstWhere('key', $targetKey),
                    'status' => 'mapped',
                ];
            } elseif ($targetType === 'custom' && $targetKey) {
                $customField = InventoryCustomField::find($targetKey);
                if ($customField) {
                    $mappedFields[] = [
                        'excel_column' => $excelColumn,
                        'target' => ['key' => 'custom_'.$customField->id, 'label' => $customField->name, 'type' => 'custom'],
                        'status' => 'mapped',
                    ];
                }
            }
        }

        // Check required fields
        foreach ($systemFields as $field) {
            if ($field['required'] && !in_array($field['key'], $mappedSystemKeys)) {
                $warnings[] = "Required field '{$field['label']}' is not mapped.";
            }
        }

        // Create custom fields if requested
        $createdCustomFields = [];
        foreach ($customFieldsToCreate as $cf) {
            $key = 'custom_' . str_slug($cf['name']);
            $existing = InventoryCustomField::query()->where('field_key', $key)->first();
            if (!$existing) {
                $existing = InventoryCustomField::create([
                    'name' => $cf['name'],
                    'field_key' => $key,
                    'field_type' => $cf['field_type'] ?? 'text',
                    'description' => $cf['description'] ?? null,
                    'is_active' => true,
                    'created_by' => auth()->id(),
                ]);
            }
            $createdCustomFields[] = $existing;
            $mappedFields[] = [
                'excel_column' => $cf['excel_column'] ?? $cf['name'],
                'target' => ['key' => 'custom_'.$existing->id, 'label' => $existing->name, 'type' => 'custom'],
                'status' => 'mapped',
            ];
        }

        $import->update([
            'column_mapping' => $columnMapping,
            'status' => 'validated',
        ]);

        return [
            'import_id' => $importId,
            'mapped_fields' => $mappedFields,
            'warnings' => $warnings,
            'errors' => $errors,
            'is_valid' => empty($errors),
        ];
    }

    /**
     * Step 4-5: Validate all data rows and return row-level validation.
     */
    public function validateData(int $importId, array $columnMapping): array
    {
        $import = InventoryImport::findOrFail($importId);
        $spreadsheet = IOFactory::load(Storage::path($import->stored_path));
        $rows = $spreadsheet->getActiveSheet()->toArray();
        $headers = array_map('trim', $rows[0]);
        $dataRows = array_slice($rows, 1);

        $validRows = [];
        $rowErrors = [];
        $rowWarnings = [];
        $existingSkus = InventoryItem::query()->pluck('sku')->filter()->values()->toArray();

        foreach ($dataRows as $rowIndex => $row) {
            $rowNum = $rowIndex + 2; // 1-indexed, header is row 1
            $row = array_map('trim', $row);
            $errors = [];
            $warnings = [];
            $mappedData = [];

            foreach ($columnMapping as $mapping) {
                if (($mapping['target_type'] ?? 'ignore') === 'ignore') {
                    continue;
                }

                $excelIndex = $mapping['excel_index'];
                $value = $row[$excelIndex] ?? '';
                $targetType = $mapping['target_type'];
                $targetKey = $mapping['target_key'] ?? null;

                if ($targetType === 'system') {
                    $mappedData[$targetKey] = $value;

                    // Validate required
                    if ($targetKey === 'name' && empty($value)) {
                        $errors[] = "Row {$rowNum}: Item name is required.";
                    }

                    // Validate category exists
                    if ($targetKey === 'category_name' && !empty($value)) {
                        $catExists = InventoryCategory::query()->where('name', $value)->exists();
                        if (!$catExists) {
                            $warnings[] = "Row {$rowNum}: Category '{$value}' not found. It will be created.";
                        }
                    }

                    // Check duplicate SKU
                    if ($targetKey === 'sku' && !empty($value)) {
                        if (in_array($value, $existingSkus)) {
                            $errors[] = "Row {$rowNum}: SKU '{$value}' already exists.";
                        }
                    }
                } elseif ($targetType === 'custom') {
                    $mappedData['custom_' . $targetKey] = $value;
                }
            }

            if (!empty($errors)) {
                $rowErrors = array_merge($rowErrors, $errors);
            } else {
                $validRows[] = $mappedData;
            }
            $rowWarnings = array_merge($rowWarnings, $warnings);
        }

        $import->update([
            'total_rows' => count($dataRows),
            'status' => 'validated',
        ]);

        return [
            'import_id' => $importId,
            'total_rows' => count($dataRows),
            'valid_rows' => count($validRows),
            'error_count' => count($rowErrors),
            'warning_count' => count($rowWarnings),
            'row_errors' => $rowErrors,
            'row_warnings' => $rowWarnings,
            'preview_data' => array_slice($validRows, 0, 10),
        ];
    }

    /**
     * Step 6-7: Execute the import.
     */
    public function executeImport(int $importId, array $columnMapping): array
    {
        $import = InventoryImport::findOrFail($importId);
        $spreadsheet = IOFactory::load(Storage::path($import->stored_path));
        $rows = $spreadsheet->getActiveSheet()->toArray();
        $headers = array_map('trim', $rows[0]);
        $dataRows = array_slice($rows, 1);

        $imported = 0;
        $failed = 0;
        $skipped = 0;
        $errors = [];
        $existingSkus = InventoryItem::query()->pluck('sku')->filter()->values()->toArray();

        DB::transaction(function () use ($dataRows, $columnMapping, $existingSkus, &$imported, &$failed, &$skipped, &$errors, $import) {
            foreach ($dataRows as $rowIndex => $row) {
                $rowNum = $rowIndex + 2;
                $row = array_map('trim', $row);
                $data = ['name' => '', 'sku' => '', 'quantity' => 0, 'unit' => '', 'reorder_level' => null, 'remarks' => ''];
                $customValues = [];
                $hasError = false;

                foreach ($columnMapping as $mapping) {
                    if (($mapping['target_type'] ?? 'ignore') === 'ignore') {
                        continue;
                    }

                    $excelIndex = $mapping['excel_index'];
                    $value = $row[$excelIndex] ?? '';
                    $targetType = $mapping['target_type'];
                    $targetKey = $mapping['target_key'] ?? null;

                    if ($targetType === 'system') {
                        if ($targetKey === 'name' && empty($value)) {
                            $errors[] = "Row {$rowNum}: Item name is required.";
                            $hasError = true;
                            break;
                        }
                        if ($targetKey === 'quantity') {
                            $data[$targetKey] = (int) $value;
                        } elseif ($targetKey === 'reorder_level') {
                            $data[$targetKey] = $value !== '' ? (int) $value : null;
                        } elseif ($targetKey === 'category_name') {
                            if (!empty($value)) {
                                $category = InventoryCategory::query()->firstOrCreate(
                                    ['name' => $value],
                                    ['code' => strtoupper(substr(str_slug($value), 0, 10)), 'description' => 'Created during import']
                                );
                                $data['inventory_category_id'] = $category->id;
                            }
                        } else {
                            $data[$targetKey] = $value;
                        }

                        // Check duplicate SKU
                        if ($targetKey === 'sku' && !empty($value)) {
                            if (in_array($value, $existingSkus)) {
                                $errors[] = "Row {$rowNum}: SKU '{$value}' already exists.";
                                $hasError = true;
                                break;
                            }
                            $existingSkus[] = $value;
                        }
                    } elseif ($targetType === 'custom') {
                        $customValues[(int) $targetKey] = $value;
                    }
                }

                if ($hasError) {
                    $failed++;
                    continue;
                }

                try {
                    $item = InventoryItem::create($data);
                    $imported++;

                    // Save custom field values
                    foreach ($customValues as $fieldId => $val) {
                        if (!empty($val)) {
                            DB::table('inventory_item_custom_fields')->insert([
                                'inventory_item_id' => $item->id,
                                'inventory_custom_field_id' => $fieldId,
                                'value' => $val,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Row {$rowNum}: " . $e->getMessage();
                }
            }

            $import->update([
                'imported_rows' => $imported,
                'failed_rows' => $failed,
                'skipped_rows' => $skipped,
                'import_errors' => $errors,
                'status' => 'completed',
            ]);
        });

        return [
            'import_id' => $importId,
            'imported' => $imported,
            'failed' => $failed,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Get import history.
     */
    public function getHistory(): array
    {
        return InventoryImport::query()
            ->with('creator')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($import) => [
                'id' => $import->id,
                'filename' => $import->original_filename,
                'imported_by' => $import->creator?->full_name ?: $import->creator?->email,
                'imported_at' => $import->created_at?->format('Y-m-d H:i:s'),
                'total_rows' => $import->total_rows,
                'imported_rows' => $import->imported_rows,
                'failed_rows' => $import->failed_rows,
                'skipped_rows' => $import->skipped_rows,
                'status' => $import->status,
                'errors' => $import->import_errors,
            ])
            ->toArray();
    }

    /**
     * Auto-suggest a system field based on Excel column name.
     */
    private function suggestMapping(string $excelColumn, array $systemFields): ?array
    {
        $normalized = strtolower(trim($excelColumn));
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized);

        $patterns = [
            'name' => ['itemname', 'assetname', 'equipmentname', 'productname', 'descriptionofitem', 'item', 'asset', 'equipment', 'product'],
            'sku' => ['sku', 'code', 'itemcode', 'assetcode', 'propertyno', 'propertynumber', 'propertyno', 'stockcode', 'partnumber', 'reference'],
            'category_name' => ['category', 'type', 'classification', 'itemtype', 'assettype', 'equipmenttype', 'categoryname'],
            'unit' => ['unit', 'uom', 'measurement', 'unitofmeasure', 'unitofmeasurement'],
            'quantity' => ['quantity', 'qty', 'count', 'numberofitems', 'stock', 'available', 'onhand'],
            'reorder_level' => ['reorder', 'reorderlevel', 'minstock', 'minimumstock', 'threshold', 'alertlevel'],
            'remarks' => ['remarks', 'notes', 'comments', 'description', 'additionalinfo', 'note'],
        ];

        foreach ($patterns as $fieldKey => $aliases) {
            foreach ($aliases as $alias) {
                if ($normalized === $alias || str_contains($normalized, $alias)) {
                    return collect($systemFields)->firstWhere('key', $fieldKey);
                }
            }
        }

        return null;
    }
}