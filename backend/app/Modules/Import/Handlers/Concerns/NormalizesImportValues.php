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
