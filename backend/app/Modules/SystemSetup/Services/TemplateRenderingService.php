<?php

namespace App\Modules\SystemSetup\Services;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Csv as CsvWriter;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;

/**
 * TemplateRenderingService
 *
 * Resolves the default active template for a document type and renders
 * it using the provided data. If no template is configured, callers
 * should fall back to their existing hardcoded logic.
 */
class TemplateRenderingService
{
    public function __construct(
        private readonly DocumentTemplateService $templateService,
    ) {}

    /**
     * Check whether a default template exists for the given document type.
     */
    public function hasTemplate(DocumentType|string $type): bool
    {
        return $this->templateService->hasDefault($type);
    }

    /**
     * Get the default template for a document type.
     */
    public function getTemplate(DocumentType|string $type): ?DocumentTemplate
    {
        return $this->templateService->resolveDefault($type);
    }

    /**
     * Render an Excel/CSV export using the default template.
     *
     * The template file is loaded as a spreadsheet. Placeholders in the
     * format {{key}} are replaced with values from the data array.
     * If no template exists, returns null so the caller can fall back.
     *
     * @param  array  $data  Key-value pairs for placeholder replacement
     * @param  string $outputFormat  'xlsx' or 'csv'
     * @return array{path: string, filename: string}|null
     */
    public function renderExport(
        DocumentType|string $type,
        array $data,
        string $outputFormat = 'xlsx',
    ): ?array {
        $template = $this->templateService->resolveDefault($type);

        if (! $template) {
            return null;
        }

        $fullPath = Storage::disk('local')->path($template->file_path);

        if (! file_exists($fullPath)) {
            return null;
        }

        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        // Replace placeholders in all cells
        foreach ($sheet->getRowIterator() as $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);

            foreach ($cellIterator as $cell) {
                $value = $cell->getValue();

                if (is_string($value)) {
                    $replaced = $this->replacePlaceholders($value, $data);

                    if ($replaced !== $value) {
                        $cell->setValue($replaced);
                    }
                }
            }
        }

        // Generate output file
        $filename = $this->generateFilename($template, $outputFormat);
        $path = 'exports/'.$filename;

        Storage::makeDirectory('exports');

        if ($outputFormat === 'csv') {
            $writer = new CsvWriter($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclose('"');
            $writer->setEscape('\\');
            $writer->save(Storage::path($path));
        } else {
            $writer = new XlsxWriter($spreadsheet);
            $writer->save(Storage::path($path));
        }

        return [
            'path'     => $path,
            'filename' => $filename,
        ];
    }

    /**
     * Render a report export using the default template.
     *
     * This is used for report-type documents (inventory report, asset report, etc.)
     * where the data is a collection of rows.
     *
     * @param  array  $data  Key-value pairs for placeholder replacement
     * @param  array  $rows  Array of row data for tabular content
     * @param  string $outputFormat  'xlsx' or 'csv'
     * @return array{path: string, filename: string}|null
     */
    public function renderReport(
        DocumentType|string $type,
        array $data = [],
        array $rows = [],
        string $outputFormat = 'xlsx',
    ): ?array {
        $template = $this->templateService->resolveDefault($type);

        if (! $template) {
            return null;
        }

        $fullPath = Storage::disk('local')->path($template->file_path);

        if (! file_exists($fullPath)) {
            return null;
        }

        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        // Replace placeholders in all cells
        foreach ($sheet->getRowIterator() as $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);

            foreach ($cellIterator as $cell) {
                $value = $cell->getValue();

                if (is_string($value)) {
                    $replaced = $this->replacePlaceholders($value, $data);

                    if ($replaced !== $value) {
                        $cell->setValue($replaced);
                    }
                }
            }
        }

        // If rows are provided, append them after the existing content
        if (! empty($rows)) {
            $startRow = $sheet->getHighestRow() + 1;

            // Write headers from first row if not already present
            if (! empty($rows)) {
                $headers = array_keys($rows[0]);
                $col = 1;
                foreach ($headers as $header) {
                    $sheet->setCellValueByColumnAndIndex($col, $startRow, $header);
                    $col++;
                }
                $startRow++;

                // Write data rows
                foreach ($rows as $rowData) {
                    $col = 1;
                    foreach ($rowData as $value) {
                        $sheet->setCellValueByColumnAndIndex($col, $startRow, $value);
                        $col++;
                    }
                    $startRow++;
                }
            }
        }

        // Auto-size columns
        foreach (range('A', 'Z') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = $this->generateFilename($template, $outputFormat);
        $path = 'exports/'.$filename;

        Storage::makeDirectory('exports');

        if ($outputFormat === 'csv') {
            $writer = new CsvWriter($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclose('"');
            $writer->setEscape('\\');
            $writer->save(Storage::path($path));
        } else {
            $writer = new XlsxWriter($spreadsheet);
            $writer->save(Storage::path($path));
        }

        return [
            'path'     => $path,
            'filename' => $filename,
        ];
    }

    /**
     * Replace {{key}} placeholders with values from the data array.
     */
    private function replacePlaceholders(string $text, array $data): string
    {
        foreach ($data as $key => $value) {
            $placeholder = '{{'.$key.'}}';
            $text = str_replace($placeholder, $this->formatValue($value), $text);
        }

        return $text;
    }

    /**
     * Format a value for insertion into a template.
     */
    private function formatValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof \Illuminate\Support\Carbon || $value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value)) {
            return implode(', ', $value);
        }

        return (string) $value;
    }

    /**
     * Generate a filename for the exported file.
     */
    private function generateFilename(DocumentTemplate $template, string $format): string
    {
        $baseName = Str::slug($template->name);
        $timestamp = now()->format('Y-m-d-His');

        return $baseName.'-'.$timestamp.'.'.$format;
    }
}
