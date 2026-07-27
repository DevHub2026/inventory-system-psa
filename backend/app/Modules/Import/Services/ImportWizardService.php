<?php

namespace App\Modules\Import\Services;

use App\Models\InventoryImport;
use App\Models\User;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportWizardService
{
    public function __construct(private readonly ImportRegistry $registry) {}

    public function types(): array
    {
        return $this->registry->types();
    }

    public function configuration(string $type): array
    {
        $handler = $this->registry->handler($type);

        return [
            'type' => $handler->type(),
            'label' => $handler->label(),
            'entity_label' => $handler->entityLabel(),
            'system_fields' => $handler->systemFields(),
            'custom_fields' => $handler->customFields(),
            'supports_custom_fields' => $handler->supportsCustomFields(),
        ];
    }

    public function uploadAndParse(User $user, string $storedPath, string $type): array
    {
        $handler = $this->registry->handler($type);
        [$headers, $dataRows] = $this->readRows($storedPath);

        if (count($dataRows) < 1) {
            throw new \InvalidArgumentException('The import file is empty or has no data rows.');
        }

        $columnInfo = [];
        foreach ($headers as $columnIndex => $header) {
            $nonEmptyCount = 0;
            $sampleValues = [];

            foreach ($dataRows as $row) {
                $value = trim((string) ($row[$columnIndex] ?? ''));
                if ($value === '') {
                    continue;
                }

                $nonEmptyCount++;
                if (count($sampleValues) < 3) {
                    $sampleValues[] = $value;
                }
            }

            $columnInfo[] = [
                'index' => $columnIndex,
                'header' => $header,
                'non_empty_count' => $nonEmptyCount,
                'sample_values' => $sampleValues,
                'is_empty' => $nonEmptyCount === 0,
            ];
        }

        $headerCounts = array_count_values($headers);
        $duplicateHeaders = array_filter($headerCounts, fn (int $count): bool => $count > 1);
        $systemFields = $handler->systemFields();

        $import = InventoryImport::query()->create([
            'import_type' => $handler->type(),
            'original_filename' => basename($storedPath),
            'stored_path' => $storedPath,
            'total_rows' => count($dataRows),
            'status' => 'pending',
            'created_by' => $user->id,
        ]);

        return [
            'import_id' => $import->id,
            'import_type' => $handler->type(),
            'entity_label' => $handler->entityLabel(),
            'filename' => basename($storedPath),
            'total_rows' => count($dataRows),
            'headers' => $headers,
            'preview_rows' => array_slice($dataRows, 0, 5),
            'columns' => $columnInfo,
            'duplicate_headers' => array_keys($duplicateHeaders),
            'suggested_mappings' => array_map(fn (array $column): array => [
                'excel_column' => $column['header'],
                'excel_index' => $column['index'],
                'suggested_system_field' => $this->suggestMapping($column['header'], $systemFields, $handler->aliases()),
                'is_empty' => $column['is_empty'],
                'sample_values' => $column['sample_values'],
            ], $columnInfo),
            'system_fields' => $systemFields,
            'custom_fields' => $handler->customFields(),
            'supported_import_types' => $this->types(),
        ];
    }

    public function validateMapping(int $importId, string $type, array $columnMapping, array $customFieldsToCreate = [], ?User $user = null): array
    {
        $handler = $this->handlerForImport($importId, $type);
        $systemFields = $handler->systemFields();
        $errors = [];
        $warnings = [];
        $mappedFields = [];
        $mappedSystemKeys = [];
        $createdCustomFields = [];

        foreach ($customFieldsToCreate as $customField) {
            if (! $handler->supportsCustomFields()) {
                $warnings[] = "{$handler->label()} imports do not support custom fields. '{$customField['name']}' was ignored.";
                continue;
            }

            if ($user instanceof User) {
                $created = $handler->createCustomField($customField, $user);
                if ($created !== null) {
                    $createdCustomFields[] = $created;
                }
            }
        }

        foreach ($columnMapping as $mapping) {
            $targetType = $mapping['target_type'] ?? 'ignore';
            $targetKey = $mapping['target_key'] ?? null;

            if ($targetType === 'ignore') {
                continue;
            }

            if ($targetType === 'custom' && ! $handler->supportsCustomFields()) {
                $warnings[] = "Column '{$mapping['excel_column']}' was ignored because {$handler->label()} does not support custom fields.";
                continue;
            }

            if ($targetType === 'system' && $targetKey) {
                $field = collect($systemFields)->firstWhere('key', $targetKey);
                if ($field === null) {
                    $errors[] = "Column '{$mapping['excel_column']}' maps to an unknown field.";
                    continue;
                }

                $mappedSystemKeys[] = $targetKey;
                $mappedFields[] = [
                    'excel_column' => $mapping['excel_column'],
                    'target' => $field,
                    'status' => 'mapped',
                ];
            }
        }

        foreach ($systemFields as $field) {
            if (($field['required'] ?? false) && ! in_array($field['key'], $mappedSystemKeys, true)) {
                $errors[] = "Required field '{$field['label']}' is not mapped.";
            }
        }

        InventoryImport::query()->whereKey($importId)->update([
            'column_mapping' => $columnMapping,
            'status' => empty($errors) ? 'validated' : 'pending',
        ]);

        return [
            'import_id' => $importId,
            'import_type' => $handler->type(),
            'mapped_fields' => $mappedFields,
            'created_custom_fields' => $createdCustomFields,
            'warnings' => $warnings,
            'errors' => $errors,
            'is_valid' => empty($errors),
        ];
    }

    public function validateData(int $importId, string $type, array $columnMapping): array
    {
        $handler = $this->handlerForImport($importId, $type);
        $import = InventoryImport::query()->findOrFail($importId);
        [, $dataRows] = $this->readRows((string) $import->stored_path);

        $validRows = [];
        $rowErrors = [];
        $rowWarnings = [];
        $context = [];

        foreach ($dataRows as $rowIndex => $row) {
            $rowNumber = $rowIndex + 2;
            $validated = $handler->validateRow($this->mappedRow($row, $columnMapping), $rowNumber, $context);

            if ($validated['errors'] !== []) {
                $rowErrors = array_merge($rowErrors, $validated['errors']);
                continue;
            }

            $validRows[] = $validated['data'];
            $rowWarnings = array_merge($rowWarnings, $validated['warnings']);
        }

        $import->update([
            'total_rows' => count($dataRows),
            'status' => empty($rowErrors) ? 'validated' : 'pending',
        ]);

        return [
            'import_id' => $importId,
            'import_type' => $handler->type(),
            'entity_label' => $handler->entityLabel(),
            'total_rows' => count($dataRows),
            'valid_rows' => count($validRows),
            'error_count' => count($rowErrors),
            'warning_count' => count($rowWarnings),
            'row_errors' => $rowErrors,
            'row_warnings' => $rowWarnings,
            'preview_data' => array_slice($validRows, 0, 10),
        ];
    }

    public function executeImport(int $importId, string $type, array $columnMapping, User $user): array
    {
        $handler = $this->handlerForImport($importId, $type);
        $import = InventoryImport::query()->findOrFail($importId);
        [, $dataRows] = $this->readRows((string) $import->stored_path);

        $imported = 0;
        $failed = 0;
        $skipped = 0;
        $errors = [];
        $context = [];

        DB::transaction(function () use ($handler, $dataRows, $columnMapping, $user, &$imported, &$failed, &$errors, &$context, $import): void {
            $import->update(['status' => 'importing']);

            foreach ($dataRows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 2;
                $validated = $handler->validateRow($this->mappedRow($row, $columnMapping), $rowNumber, $context);

                if ($validated['errors'] !== []) {
                    $failed++;
                    $errors = array_merge($errors, $validated['errors']);
                    continue;
                }

                try {
                    $handler->importRow($validated['data'], $validated['custom_values'] ?? [], $user);
                    $imported++;
                } catch (\Throwable $exception) {
                    $failed++;
                    $errors[] = "Row {$rowNumber}: {$exception->getMessage()}";
                }
            }
        });

        $import->update([
            'imported_rows' => $imported,
            'failed_rows' => $failed,
            'skipped_rows' => $skipped,
            'import_errors' => $errors,
            'status' => $failed > 0 ? 'completed_with_errors' : 'completed',
        ]);

        return [
            'import_id' => $importId,
            'import_type' => $handler->type(),
            'entity_label' => $handler->entityLabel(),
            'imported' => $imported,
            'failed' => $failed,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    public function getHistory(?string $type = null): array
    {
        return InventoryImport::query()
            ->with('creator')
            ->when($type !== null, fn ($query) => $query->where('import_type', $type))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (InventoryImport $import) => [
                'id' => $import->id,
                'import_type' => $import->import_type ?? 'inventory',
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

    private function handlerForImport(int $importId, string $type): ImportHandlerInterface
    {
        $import = InventoryImport::query()->findOrFail($importId);
        $storedType = $import->import_type ?: 'inventory';

        if ($storedType !== $type) {
            throw new \InvalidArgumentException("Import {$importId} is a '{$storedType}' import, not '{$type}'.");
        }

        return $this->registry->handler($storedType);
    }

    /**
     * @return array{0: array<int, string>, 1: array<int, array<int, mixed>>}
     */
    private function readRows(string $storedPath): array
    {
        $spreadsheet = IOFactory::load($this->absolutePath($storedPath));
        $rows = $spreadsheet->getActiveSheet()->toArray();

        if (count($rows) < 2) {
            throw new \InvalidArgumentException('The import file is empty or has no data rows.');
        }

        $headers = array_map(fn (mixed $header): string => trim((string) $header), $rows[0]);
        $dataRows = array_values(array_filter(array_slice($rows, 1), fn (array $row): bool => ! $this->isEmptyRow($row)));

        return [$headers, $dataRows];
    }

    private function absolutePath(string $storedPath): string
    {
        if (preg_match('/^[A-Za-z]:[\\\\\\/]/', $storedPath) === 1 || str_starts_with($storedPath, '/') || str_starts_with($storedPath, '\\\\')) {
            return $storedPath;
        }

        return Storage::path($storedPath);
    }

    /**
     * @param array<int, mixed> $row
     * @param array<int, array<string, mixed>> $columnMapping
     * @return array<string, mixed>
     */
    private function mappedRow(array $row, array $columnMapping): array
    {
        $mapped = ['_custom' => []];

        foreach ($columnMapping as $mapping) {
            if (($mapping['target_type'] ?? 'ignore') === 'ignore') {
                continue;
            }

            $excelIndex = (int) ($mapping['excel_index'] ?? 0);
            $value = is_string($row[$excelIndex] ?? null) ? trim($row[$excelIndex]) : ($row[$excelIndex] ?? null);

            if (($mapping['target_type'] ?? null) === 'custom') {
                $mapped['_custom'][(string) ($mapping['target_key'] ?? '')] = $value;
                continue;
            }

            $mapped[(string) ($mapping['target_key'] ?? '')] = $value;
        }

        return $mapped;
    }

    private function suggestMapping(string $excelColumn, array $systemFields, array $aliases): ?array
    {
        $normalized = strtolower(trim($excelColumn));
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized) ?? '';

        foreach ($aliases as $fieldKey => $patterns) {
            foreach ($patterns as $pattern) {
                if ($normalized === $pattern || str_contains($normalized, $pattern)) {
                    return collect($systemFields)->firstWhere('key', $fieldKey);
                }
            }
        }

        return null;
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }
}
