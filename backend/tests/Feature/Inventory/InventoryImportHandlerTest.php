<?php

namespace Tests\Feature\Inventory;

use App\Models\InventoryCategory;
use App\Models\User;
use App\Modules\Import\Handlers\InventoryImportHandler;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryItemType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryImportHandlerTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_row_creates_inventory_item_with_item_type(): void
    {
        $user = User::factory()->create();

        $handler = app(InventoryImportHandler::class);
        $validatedData = [
            'name' => 'Projector',
            'sku' => 'PJ-001',
            'item_type_name' => 'Electronics',
            'category_name' => 'Office Equipment',
            'unit' => 'piece',
            'quantity' => 5,
            'reorder_level' => 2,
            'remarks' => 'Imported item',
        ];

        $handler->importRow($validatedData, [], $user);

        $item = InventoryItem::query()->where('sku', 'PJ-001')->first();

        $this->assertNotNull($item, 'Inventory item should be created.');
        $this->assertSame('Projector', $item->name);
        $this->assertNotNull($item->item_type_id, 'Inventory item should have an item type assigned.');
        $this->assertSame('Electronics', $item->itemType->name);

        $this->assertDatabaseHas('inventory_item_types', [
            'name' => 'Electronics',
        ]);

        $this->assertDatabaseHas('inventory_categories', [
            'name' => 'Office Equipment',
        ]);
    }
}
