<?php

namespace App\Modules\Import\Handlers\Concerns;

use Illuminate\Support\Str;

trait NormalizesImportValues
{
    protected function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    protected function normalizeNumericString(mixed $value): ?string
    {
        $normalized = $this->nullableString($value);

        if ($normalized === null) {
            return null;
        }

        $normalized = preg_replace('/[\x00-\x1F\x7F\x{FEFF}]/u', '', $normalized) ?? $normalized;
        $normalized = str_replace(["\u{00A0}", "\t", "\r", "\n", '(', ')'], '', $normalized);
        $normalized = preg_replace('/\s+/u', '', $normalized);
        $normalized = preg_replace('/[$€£¥₱₩₹₽₺₨₫₵₾₿]/u', '', $normalized);

        if (! preg_match('/^[+-]?[0-9.,]+$/u', $normalized)) {
            return null;
        }

        if ($normalized === '' || $normalized === '-' || $normalized === '+' || $normalized === '.' || $normalized === ',') {
            return null;
        }

        $hasDot = str_contains($normalized, '.');
        $hasComma = str_contains($normalized, ',');

        if ($hasDot && $hasComma) {
            $lastDot = strrpos($normalized, '.');
            $lastComma = strrpos($normalized, ',');

            if ($lastComma > $lastDot) {
                $normalized = str_replace('.', '', $normalized);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif ($hasComma) {
            $commaCount = substr_count($normalized, ',');
            $parts = explode(',', $normalized);
            $fraction = $parts[count($parts) - 1] ?? '';

            if ($commaCount > 1 || strlen($fraction) !== 3) {
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif ($hasDot) {
            $dotCount = substr_count($normalized, '.');
            $parts = explode('.', $normalized);
            $fraction = $parts[count($parts) - 1] ?? '';

            if ($dotCount > 1 && strlen($fraction) !== 3) {
                $normalized = str_replace('.', '', $normalized);
            }
        }

        $normalized = preg_replace('/^\+/', '', $normalized);

        return is_numeric($normalized) ? $normalized : null;
    }

    protected function integerNumber(mixed $value): ?int
    {
        $normalized = $this->normalizeNumericString($value);

        if ($normalized === null) {
            return null;
        }

        $floatValue = (float) $normalized;

        if (fmod($floatValue, 1.0) !== 0.0) {
            return null;
        }

        return (int) $floatValue;
    }

    protected function decimalNumber(mixed $value): ?float
    {
        $normalized = $this->normalizeNumericString($value);

        if ($normalized === null) {
            return null;
        }

        return (float) $normalized;
    }

    protected function booleanValue(mixed $value, bool $default = true): bool
    {
        $normalized = Str::of((string) $value)->trim()->lower()->toString();

        if ($normalized === '') {
            return $default;
        }

        return in_array($normalized, ['1', 'yes', 'y', 'true', 'active', 'enabled'], true);
    }

    protected function slugCode(string $value, int $length = 50): string
    {
        return Str::of($value)->slug('_')->upper()->limit($length, '')->toString();
    }
}
