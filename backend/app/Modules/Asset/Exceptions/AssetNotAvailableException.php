<?php

namespace App\Modules\Asset\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class AssetNotAvailableException extends Exception
{
    public function __construct(string $message = 'The asset is not available for this operation.')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'errors' => (object) [],
        ], 409);
    }
}
