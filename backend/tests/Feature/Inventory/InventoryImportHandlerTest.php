<?php

namespace Tests\Feature\Inventory;

use App\Models\InventoryCategory;
use App\Models\InventoryImport;
use App\Models\User;
use App\Modules\Import\Handlers\InventoryImportHandler;
use App\Modules\Import\Services\ImportWizardService;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryItemType;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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

    public function test_validate_row_accepts_quantity_with_thousands_separator(): void
    {
        $handler = app(InventoryImportHandler::class);
        $context = [];

        $result = $handler->validateRow([
            'name' => 'Laptop',
            'sku' => 'LT-100',
            'quantity' => '1,250',
            'reorder_level' => '75',
            'category_name' => 'Office Equipment',
            'item_type_name' => 'Electronics',
        ], 2, $context);

        $this->assertSame([], $result['errors']);
        $this->assertSame(1250, $result['data']['quantity']);
        $this->assertSame(75, $result['data']['reorder_level']);
    }

    public function test_validate_row_accepts_currency_and_decimal_quantity_formats(): void
    {
        $handler = app(InventoryImportHandler::class);
        $context = [];

        $result = $handler->validateRow([
            'name' => 'Monitor',
            'sku' => 'MN-200',
            'quantity' => '₱1,250.00',
            'reorder_level' => '1.250,00',
            'category_name' => 'Office Equipment',
            'item_type_name' => 'Electronics',
        ], 3, $context);

        $this->assertSame([], $result['errors']);
        $this->assertSame(1250, $result['data']['quantity']);
        $this->assertSame(1250, $result['data']['reorder_level']);
    }

    public function test_validate_row_rejects_non_numeric_quantity_values(): void
    {
        $handler = app(InventoryImportHandler::class);
        $context = [];

        $result = $handler->validateRow([
            'name' => 'Keyboard',
            'sku' => 'KB-300',
            'quantity' => '12XYZ',
            'reorder_level' => 'ABC',
            'category_name' => 'Office Equipment',
            'item_type_name' => 'Electronics',
        ], 4, $context);

        $this->assertSame([
            'Row 4: Quantity must be numeric.',
            'Row 4: Reorder level must be numeric.',
        ], $result['errors']);
    }

    public function test_upload_suggests_unit_cost_and_unit_separately(): void
    {
        Storage::fake('local');
        Storage::makeDirectory('imports');

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['Item Name', 'SKU / Item Code', 'Unit of Measure', 'Quantity', 'Unit Cost (₱)', 'Low Stock Alert'],
            ['Laptop', 'LT-900', 'pcs', '5', '80000', '2'],
        ]);

        $path = 'imports/unit-cost-map-test.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save(Storage::path($path));

        $user = User::factory()->create();
        $result = app(ImportWizardService::class)->uploadAndParse($user, $path, 'inventory');

        $unitCostMapping = collect($result['suggested_mappings'])
            ->firstWhere('excel_column', 'Unit Cost (₱)');
        $unitMapping = collect($result['suggested_mappings'])
            ->firstWhere('excel_column', 'Unit of Measure');

        $this->assertNotNull($unitCostMapping);
        $this->assertSame('unit_cost', $unitCostMapping['suggested_system_field']['key']);
        $this->assertNotNull($unitMapping);
        $this->assertSame('unit', $unitMapping['suggested_system_field']['key']);
    }

    public function test_exported_inventory_file_round_trips_without_quantity_errors(): void
    {
        $user = User::factory()->create();
        InventoryItem::query()->create([
            'name' => 'Laptop',
            'sku' => 'LT-ROUNDTRIP-'.random_int(1000, 9999),
            'classification' => 'PPE',
            'quantity' => 1250,
            'reorder_level' => 10,
            'unit' => 'pcs',
            'unit_cost' => 200.5,
            'remarks' => 'hello',
        ]);

        $path = app(InventoryService::class)->export([], 'xlsx');
        InventoryItem::query()->delete();

        $upload = app(ImportWizardService::class)->uploadAndParse($user, $path, 'inventory');

        $stockStatusMapping = collect($upload['suggested_mappings'])
            ->firstWhere('excel_column', 'Stock Status');
        $this->assertNotNull($stockStatusMapping);
        $this->assertNull($stockStatusMapping['suggested_system_field']);

        $columnMappings = collect($upload['suggested_mappings'])
            ->map(function (array $mapping): array {
                return [
                    'excel_column' => $mapping['excel_column'],
                    'excel_index' => $mapping['excel_index'],
                    'target_type' => $mapping['suggested_system_field'] ? 'system' : 'ignore',
                    'target_key' => $mapping['suggested_system_field'] ? $mapping['suggested_system_field']['key'] : null,
                ];
            })
            ->all();

        $validation = app(ImportWizardService::class)->validateData($upload['import_id'], 'inventory', $columnMappings);

        $this->assertSame(0, $validation['error_count']);
        $this->assertSame(1, $validation['valid_rows']);
    }

    public function test_pending_import_can_be_resumed_and_deleted(): void
    {
        Storage::fake('local');
        Storage::makeDirectory('imports');
        $user = User::factory()->create();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['Item Name', 'SKU / Item Code', 'Quantity', 'Unit of Measure'],
            ['Laptop', 'LT-PA-1', '5', 'pcs'],
        ]);

        $path = 'imports/pending-import.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save(Storage::path($path));

        $import = InventoryImport::query()->create([
            'import_type' => 'inventory',
            'original_filename' => 'pending-import.xlsx',
            'stored_path' => $path,
            'total_rows' => 1,
            'status' => 'pending',
            'created_by' => $user->id,
        ]);

        $resumed = app(ImportWizardService::class)->resumeImport($import->id, 'inventory');

        $this->assertSame($import->id, $resumed['import_id']);
        $this->assertSame('inventory', $resumed['import_type']);
        $this->assertTrue(Storage::exists($path));

        $this->assertTrue(app(ImportWizardService::class)->deleteImport($import->id, 'inventory'));
        $this->assertDatabaseMissing('inventory_imports', ['id' => $import->id]);
        $this->assertFalse(Storage::exists($path));
    }

    public function test_completed_import_is_not_resumable(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $import = InventoryImport::query()->create([
            'import_type' => 'inventory',
            'original_filename' => 'completed-import.xlsx',
            'stored_path' => 'imports/completed-import.xlsx',
            'total_rows' => 1,
            'status' => 'completed',
            'imported_rows' => 1,
            'created_by' => $user->id,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        app(ImportWizardService::class)->resumeImport($import->id, 'inventory');
    }
}
