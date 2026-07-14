<?php

namespace App\Modules\Asset\Traits;

use Illuminate\Http\JsonResponse;

trait RespondsWithJson
{
    protected function success(
        mixed $data = null,
        string $message = 'Operation completed successfully.',
        int $status = 200,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function error(
        string $message = 'An error occurred.',
        mixed $errors = null,
        int $status = 400,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors ?? (object) [],
        ], $status);
    }
}
