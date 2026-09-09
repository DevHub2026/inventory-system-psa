<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/v1/supply-requests', 'POST', [
    'items' => [
        ['inventory_item_id' => 1, 'quantity_requested' => 1]
    ]
]);
$request->headers->set('Accept', 'application/json');

$user = \App\Models\User::first();
$request->setUserResolver(function () use ($user) { return $user; });

$response = $kernel->handle($request);
echo $response->status() . "\n";
echo $response->getContent();
