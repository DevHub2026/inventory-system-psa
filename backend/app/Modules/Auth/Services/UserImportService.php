<?php

namespace App\Modules\Auth\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use ZipArchive;

class UserImportService
{
    public const INITIAL_PASSWORD = 'psasarangani2026';

    /**
     * @return array<string, mixed>
     */
    public function import(UploadedFile $file): array
    {
        $rows = $this->parseFile($file);
        $results = [];
        $seenEmails = [];
        $seenIdNumbers = [];
        $seenUsernames = [];
        $imported = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $normalizedRow = $this->normalizeRow($row);
            $validationErrors = $this->validateRow($normalizedRow);

            if ($validationErrors !== []) {
                $failed++;
                $results[] = $this->result($rowNumber, 'failed', $normalizedRow, implode(' ', $validationErrors));
                continue;
            }

            $email = strtolower(trim((string) $normalizedRow['email']));
            $idNumber = trim((string) $normalizedRow['id_number']);
            $username = $this->generateUsername((string) $normalizedRow['last_name'], $idNumber);

            if (isset($seenEmails[$email])) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'Duplicate email within import file.', $username);
                continue;
            }

            if (isset($seenIdNumbers[$idNumber])) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'Duplicate ID number within import file.', $username);
                continue;
            }

            if (isset($seenUsernames[$username])) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'Duplicate generated username within import file.', $username);
                continue;
            }

            if (User::query()->where('email', $email)->exists()) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'Email already exists.', $username);
                continue;
            }

            if (User::query()->where('employee_number', $username)->exists()) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'Generated username already exists.', $username);
                continue;
            }

            if (User::query()->where('employee_number', 'like', '%'.$idNumber)->exists()) {
                $skipped++;
                $results[] = $this->result($rowNumber, 'skipped', $normalizedRow, 'ID number already exists.', $username);
                continue;
            }

            $role = $this->resolveRole($normalizedRow);
            if (! $role instanceof Role) {
                $failed++;
                $results[] = $this->result($rowNumber, 'failed', $normalizedRow, 'Role was not found.', $username);
                continue;
            }

            $departmentId = $this->resolveDepartmentId($normalizedRow);
            if ($departmentId === false) {
                $failed++;
                $results[] = $this->result($rowNumber, 'failed', $normalizedRow, 'Department was not found.', $username);
                continue;
            }

            DB::transaction(function () use ($normalizedRow, $email, $username, $departmentId, $role): void {
                $user = User::query()->create([
                    'employee_number' => $username,
                    'first_name' => trim((string) $normalizedRow['first_name']),
                    'middle_name' => $this->nullableString($normalizedRow['middle_name'] ?? null),
                    'last_name' => trim((string) $normalizedRow['last_name']),
                    'email' => $email,
                    'password' => self::INITIAL_PASSWORD,
                    'department_id' => $departmentId,
                    'status' => UserStatus::ACTIVE->value,
                ]);

                $user->roles()->syncWithoutDetaching([$role->id]);
            });

            $seenEmails[$email] = true;
            $seenIdNumbers[$idNumber] = true;
            $seenUsernames[$username] = true;
            $imported++;
            $results[] = $this->result($rowNumber, 'imported', $normalizedRow, 'Imported successfully.', $username);
        }

        return [
            'total_rows' => count($rows),
            'imported' => $imported,
            'skipped' => $skipped,
            'failed' => $failed,
            'initial_password' => self::INITIAL_PASSWORD,
            'username_rule' => 'lowercase last name without spaces + ID number',
            'rows' => $results,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseFile(UploadedFile $file): array
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());

        return match ($extension) {
            'csv' => $this->parseCsv($file),
            'json' => $this->parseJson($file),
            'xlsx' => $this->parseXlsx($file),
            default => throw new \InvalidArgumentException('Unsupported import file type. Please upload CSV, JSON, or XLSX. Legacy XLS files must be saved as XLSX or CSV first.'),
        };
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw new \InvalidArgumentException('Unable to read CSV file.');
        }

        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);
            return [];
        }

        $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), $headers);
        $rows = [];

        while (($values = fgetcsv($handle)) !== false) {
            if ($this->isEmptyRow($values)) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($values, count($headers), null)) ?: [];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseJson(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());
        $decoded = json_decode($content === false ? '' : $content, true);

        if (! is_array($decoded)) {
            throw new \InvalidArgumentException('JSON import must contain an array of employee records.');
        }

        return array_values(array_filter($decoded, 'is_array'));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseXlsx(UploadedFile $file): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new \InvalidArgumentException('XLSX import requires the PHP zip extension.');
        }

        $zip = new ZipArchive();
        if ($zip->open($file->getRealPath()) !== true) {
            throw new \InvalidArgumentException('Unable to read XLSX file.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new \InvalidArgumentException('XLSX file must include a first worksheet.');
        }

        $sheet = simplexml_load_string($sheetXml);
        if ($sheet === false || ! isset($sheet->sheetData->row)) {
            return [];
        }

        $rows = [];
        $headers = [];

        $rowIndex = 0;
        foreach ($sheet->sheetData->row as $row) {
            $values = [];

            foreach ($row->c as $cell) {
                $reference = (string) $cell['r'];
                $columnIndex = $this->columnIndex($reference);
                $values[$columnIndex] = $this->cellValue($cell, $sharedStrings);
            }

            if ($values === []) {
                continue;
            }

            ksort($values);
            $orderedValues = [];
            for ($column = 0; $column <= max(array_keys($values)); $column++) {
                $orderedValues[] = $values[$column] ?? null;
            }

            if ($rowIndex === 0) {
                $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), $orderedValues);
                $rowIndex++;
                continue;
            }

            if ($this->isEmptyRow($orderedValues)) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($orderedValues, count($headers), null)) ?: [];
            $rowIndex++;
        }

        return $rows;
    }

    /**
     * @return array<int, string>
     */
    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $sharedStringsXml = simplexml_load_string($xml);
        if ($sharedStringsXml === false) {
            return [];
        }

        $strings = [];
        foreach ($sharedStringsXml->si as $item) {
            if (isset($item->t)) {
                $strings[] = (string) $item->t;
                continue;
            }

            $text = '';
            foreach ($item->r as $run) {
                $text .= (string) $run->t;
            }
            $strings[] = $text;
        }

        return $strings;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row): array
    {
        $normalized = [];

        foreach ($row as $key => $value) {
            $normalized[$this->normalizeHeader((string) $key)] = is_string($value) ? trim($value) : $value;
        }

        return $normalized;
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)->trim()->lower()->replace([' ', '-'], '_')->toString();
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, string>
     */
    private function validateRow(array $row): array
    {
        $validator = Validator::make($row, [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'id_number' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'department_id' => ['nullable', 'integer'],
            'department' => ['nullable', 'string', 'max:255'],
            'role_id' => ['nullable', 'integer'],
            'role' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->passes()) {
            return [];
        }

        return $validator->errors()->all();
    }

    private function generateUsername(string $lastName, string $idNumber): string
    {
        $normalizedLastName = preg_replace('/\s+/', '', strtolower(trim($lastName))) ?: '';

        return $normalizedLastName.$idNumber;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function resolveRole(array $row): ?Role
    {
        if (! empty($row['role_id'])) {
            return Role::query()->find((int) $row['role_id']);
        }

        $roleName = $this->nullableString($row['role'] ?? null) ?? UserRole::EMPLOYEE->value;

        return Role::query()->whereRaw('LOWER(name) = ?', [strtolower($roleName)])->first();
    }

    /**
     * @param array<string, mixed> $row
     */
    private function resolveDepartmentId(array $row): int|false|null
    {
        if (! empty($row['department_id'])) {
            return Department::query()->whereKey((int) $row['department_id'])->exists()
                ? (int) $row['department_id']
                : false;
        }

        $departmentName = $this->nullableString($row['department'] ?? null);
        if ($departmentName === null) {
            return null;
        }

        return Department::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($departmentName)])
            ->value('id') ?? false;
    }

    /**
     * @param array<int, mixed> $values
     */
    private function isEmptyRow(array $values): bool
    {
        foreach ($values as $value) {
            if ($this->nullableString($value) !== null) {
                return false;
            }
        }

        return true;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function columnIndex(string $cellReference): int
    {
        preg_match('/^[A-Z]+/', $cellReference, $matches);
        $letters = $matches[0] ?? 'A';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
    }

    /**
     * @param \SimpleXMLElement $cell
     * @param array<int, string> $sharedStrings
     */
    private function cellValue(\SimpleXMLElement $cell, array $sharedStrings): ?string
    {
        $value = isset($cell->v) ? (string) $cell->v : null;
        if ($value === null) {
            return null;
        }

        return ((string) $cell['t']) === 's' ? ($sharedStrings[(int) $value] ?? null) : $value;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function result(int $rowNumber, string $status, array $row, string $reason, ?string $username = null): array
    {
        return [
            'row' => $rowNumber,
            'status' => $status,
            'username' => $username,
            'email' => $this->nullableString($row['email'] ?? null),
            'reason' => $reason,
        ];
    }
}
