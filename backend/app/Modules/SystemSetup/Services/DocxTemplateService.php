<?php

namespace App\Modules\SystemSetup\Services;

use Illuminate\Support\Facades\Log;
use ZipArchive;

class DocxTemplateService
{
    /**
     * Extract {{placeholder}} tokens from a DOCX file.
     *
     * @return array{
     *   placeholders: list<string>,
     *   counts: array<string, int>,
     *   valid: list<string>,
     *   unknown: list<string>,
     *   duplicates: array<string, int>,
     *   is_valid: bool,
     *   validation_status: string
     * }
     */
    public function validateFile(string $absolutePath): array
    {
        $found = $this->scanPlaceholders($absolutePath);
        $counts = array_count_values($found);
        $unique = array_keys($counts);

        $valid = [];
        $unknown = [];

        foreach ($unique as $key) {
            if (PlaceholderRegistry::isSupported($key)) {
                $valid[] = $key;
            } else {
                $unknown[] = $key;
            }
        }

        $duplicates = array_filter($counts, fn (int $count) => $count > 1);

        $isValid = $unknown === [];
        $status = $isValid ? 'valid' : 'invalid';

        return [
            'placeholders' => $unique,
            'counts' => $counts,
            'valid' => $valid,
            'unknown' => $unknown,
            'duplicates' => $duplicates,
            'is_valid' => $isValid,
            'validation_status' => $status,
        ];
    }

    /**
     * @return list<string>
     */
    public function scanPlaceholders(string $absolutePath): array
    {
        if (! is_file($absolutePath)) {
            throw new \InvalidArgumentException('DOCX file not found.');
        }

        $zip = new ZipArchive;
        if ($zip->open($absolutePath) !== true) {
            throw new \InvalidArgumentException('Unable to open DOCX file for placeholder scanning.');
        }

        $parts = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false) {
                continue;
            }
            if (preg_match('#^word/(document|header\\d*|footer\\d*|footnotes|endnotes)\\.xml$#', $name)) {
                $parts[] = $name;
            }
        }

        $allText = '';
        foreach ($parts as $part) {
            $xml = $zip->getFromName($part);
            if ($xml === false) {
                continue;
            }
            if (preg_match_all('/<w:t[^>]*>(.*?)<\\/w:t>/s', $xml, $matches)) {
                $allText .= implode('', $matches[1]);
            }
            $allText .= ' '.strip_tags($xml);
        }

        $zip->close();

        $allText = html_entity_decode($allText, ENT_QUOTES | ENT_XML1, 'UTF-8');

        preg_match_all('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', $allText, $matches);

        return $matches[1] ?? [];
    }

    /**
     * @param  array<string, string>  $values
     */
    public function generate(string $sourceAbsolutePath, string $destinationAbsolutePath, array $values): void
    {
        if (! is_file($sourceAbsolutePath)) {
            throw new \InvalidArgumentException('Source DOCX template not found.');
        }

        $directory = dirname($destinationAbsolutePath);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        try {
            $processor = new \PhpOffice\PhpWord\TemplateProcessor($sourceAbsolutePath);
            $processor->setMacroChars('{{', '}}');

            foreach ($values as $key => $value) {
                $processor->setValue($key, $this->sanitizeValue((string) $value));
            }

            foreach ($processor->getVariables() as $variable) {
                if (! array_key_exists($variable, $values)) {
                    $processor->setValue($variable, PlaceholderRegistry::MISSING_VALUE_FALLBACK);
                }
            }

            $processor->saveAs($destinationAbsolutePath);
        } catch (\Throwable $e) {
            Log::error('DOCX generation failed', [
                'message' => $e->getMessage(),
                'source' => basename($sourceAbsolutePath),
            ]);
            throw new \RuntimeException('Failed to generate DOCX document: '.$e->getMessage(), 0, $e);
        }
    }

    private function sanitizeValue(string $value): string
    {
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value) ?? $value;
    }
}
