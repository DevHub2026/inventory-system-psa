<?php
$user = \App\Models\User::first();
\Illuminate\Support\Facades\Auth::login($user);
$request = Request::create('/api/v1/supply-requests', 'POST', [
    'items' => [
        ['inventory_item_id' => 1, 'quantity_requested' => 1]
    ]
]);
$request->headers->set('Accept', 'application/json');
$request->setUserResolver(function () use ($user) { return $user; });
$response = app()->handle($request);
echo "STATUS: " . $response->status() . "\n";
echo substr($response->getContent(), 0, 200) . "...\n";
