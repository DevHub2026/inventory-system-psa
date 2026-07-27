<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Inventory\Services\InventoryImportWizardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class InventoryImportWizardController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly InventoryImportWizardService $wizardService) {}

    /**
     * Step 1: Upload Excel file and get preview.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $path = $request->file('file')->store('imports');

        try {
            $result = $this->wizardService->uploadAndParse($request->user(), Storage::path($path));
            return $this->success($result, 'File uploaded and parsed successfully.');
        } catch (\Exception $e) {
            Storage::delete($path);
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * Step 2-3: Validate column mapping.
     */
    public function validateMapping(Request $request): JsonResponse
    {
        $request->validate([
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
            'column_mapping.*.excel_column' => ['required', 'string'],
            'column_mapping.*.excel_index' => ['required', 'integer'],
            'column_mapping.*.target_type' => ['required', 'string', 'in:system,custom,ignore'],
            'column_mapping.*.target_key' => ['nullable', 'string'],
            'custom_fields_to_create' => ['nullable', 'array'],
        ]);

        try {
            $result = $this->wizardService->validateMapping(
                (int) $request->input('import_id'),
                $request->input('column_mapping'),
                $request->input('custom_fields_to_create', [])
            );
            return $this->success($result, 'Mapping validated successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * Step 4-5: Validate all data rows.
     */
    public function validateData(Request $request): JsonResponse
    {
        $request->validate([
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
        ]);

        try {
            $result = $this->wizardService->validateData(
                (int) $request->input('import_id'),
                $request->input('column_mapping')
            );
            return $this->success($result, 'Data validation completed.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * Step 6-7: Execute the import.
     */
    public function execute(Request $request): JsonResponse
    {
        $request->validate([
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
        ]);

        try {
            $result = $this->wizardService->executeImport(
                (int) $request->input('import_id'),
                $request->input('column_mapping')
            );
            return $this->success($result, 'Import completed successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 500);
        }
    }

    /**
     * Get import history.
     */
    public function history(): JsonResponse
    {
        try {
            $history = $this->wizardService->getHistory();
            return $this->success($history, 'Import history retrieved successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 500);
        }
    }

    /**
     * Get system fields for mapping.
     */
    public function systemFields(): JsonResponse
    {
        return $this->success(
            $this->wizardService->getSystemFields(),
            'System fields retrieved successfully.'
        );
    }
}