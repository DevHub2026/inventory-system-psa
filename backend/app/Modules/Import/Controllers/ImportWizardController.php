<?php

namespace App\Modules\Import\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Import\Services\ImportWizardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ImportWizardController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly ImportWizardService $wizardService) {}

    public function types(): JsonResponse
    {
        return $this->success($this->wizardService->types(), 'Import types retrieved successfully.');
    }

    public function configuration(string $type): JsonResponse
    {
        return $this->success($this->wizardService->configuration($type), 'Import configuration retrieved successfully.');
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'import_type' => ['required', 'string'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $path = $request->file('file')->store('imports');

        try {
            $result = $this->wizardService->uploadAndParse($request->user(), $path, (string) $request->input('import_type'));

            return $this->success($result, 'File uploaded and parsed successfully.');
        } catch (\Throwable $exception) {
            Storage::delete($path);

            return $this->error($exception->getMessage(), null, 422);
        }
    }

    public function validateMapping(Request $request): JsonResponse
    {
        $request->validate([
            'import_type' => ['required', 'string'],
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
            'column_mapping.*.excel_column' => ['required', 'string'],
            'column_mapping.*.excel_index' => ['required', 'integer'],
            'column_mapping.*.target_type' => ['required', 'string', Rule::in(['system', 'custom', 'ignore'])],
            'column_mapping.*.target_key' => ['nullable', 'string'],
            'custom_fields_to_create' => ['nullable', 'array'],
        ]);

        try {
            $result = $this->wizardService->validateMapping(
                (int) $request->input('import_id'),
                (string) $request->input('import_type'),
                $request->input('column_mapping'),
                $request->input('custom_fields_to_create', []),
                $request->user(),
            );

            return $this->success($result, 'Mapping validated successfully.');
        } catch (\Throwable $exception) {
            return $this->error($exception->getMessage(), null, 422);
        }
    }

    public function validateData(Request $request): JsonResponse
    {
        $request->validate([
            'import_type' => ['required', 'string'],
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
        ]);

        try {
            $result = $this->wizardService->validateData(
                (int) $request->input('import_id'),
                (string) $request->input('import_type'),
                $request->input('column_mapping'),
            );

            return $this->success($result, 'Data validation completed.');
        } catch (\Throwable $exception) {
            return $this->error($exception->getMessage(), null, 422);
        }
    }

    public function execute(Request $request): JsonResponse
    {
        $request->validate([
            'import_type' => ['required', 'string'],
            'import_id' => ['required', 'integer', 'exists:inventory_imports,id'],
            'column_mapping' => ['required', 'array'],
        ]);

        try {
            $result = $this->wizardService->executeImport(
                (int) $request->input('import_id'),
                (string) $request->input('import_type'),
                $request->input('column_mapping'),
                $request->user(),
            );

            return $this->success($result, 'Import completed successfully.');
        } catch (\Throwable $exception) {
            return $this->error($exception->getMessage(), null, 500);
        }
    }

    public function history(Request $request): JsonResponse
    {
        return $this->success(
            $this->wizardService->getHistory($request->query('import_type')),
            'Import history retrieved successfully.',
        );
    }
}
