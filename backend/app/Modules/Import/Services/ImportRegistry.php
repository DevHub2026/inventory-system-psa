<?php

namespace App\Modules\Import\Services;

use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\AssetCategoryImportHandler;
use App\Modules\Import\Handlers\DepartmentImportHandler;
use App\Modules\Import\Handlers\InventoryImportHandler;
use App\Modules\Import\Handlers\LocationImportHandler;
use App\Modules\Import\Handlers\UserImportHandler;
use InvalidArgumentException;

class ImportRegistry
{
    /**
     * @return array<string, ImportHandlerInterface>
     */
    public function handlers(): array
    {
        return [
            'inventory' => app(InventoryImportHandler::class),
            'users' => app(UserImportHandler::class),
            'asset_categories' => app(AssetCategoryImportHandler::class),
            'locations' => app(LocationImportHandler::class),
            'departments' => app(DepartmentImportHandler::class),
        ];
    }

    public function handler(string $type): ImportHandlerInterface
    {
        $handler = $this->handlers()[$type] ?? null;

        if (! $handler instanceof ImportHandlerInterface) {
            throw new InvalidArgumentException("Unsupported import type '{$type}'.");
        }

        return $handler;
    }

    public function types(): array
    {
        return collect($this->handlers())
            ->map(fn (ImportHandlerInterface $handler) => [
                'key' => $handler->type(),
                'label' => $handler->label(),
                'entity_label' => $handler->entityLabel(),
                'supports_custom_fields' => $handler->supportsCustomFields(),
            ])
            ->values()
            ->all();
    }
}
