<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password/{token}', function (string $token) {
    return response()->json([
        'success' => true,
        'message' => 'Password reset endpoint is available.',
        'data' => ['token' => $token],
    ]);
})->name('password.reset');
