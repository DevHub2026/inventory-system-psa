<?php

namespace App\Modules\Import\Contracts;

use App\Models\User;

interface ImportHandlerInterface
{
    public function type(): string;

    public function label(): string;

    public function entityLabel(): string;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function systemFields(): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function customFields(): array;

    /**
     * @return array<string, array<int, string>>
     */
    public function aliases(): array;

    /**
     * @param array<string, mixed> $mappedData
     * @param array<string, mixed> $context
     * @return array{data: array<string, mixed>, custom_values?: array<int|string, mixed>, errors: array<int, string>, warnings: array<int, string>}
     */
    public function validateRow(array $mappedData, int $rowNumber, array &$context): array;

    /**
     * @param array<string, mixed> $validatedData
     * @param array<int|string, mixed> $customValues
     */
    public function importRow(array $validatedData, array $customValues, User $user): void;

    public function supportsCustomFields(): bool;

    public function createCustomField(array $field, User $user): ?array;
}
