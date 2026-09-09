<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
$role = \App\Models\Role::firstOrCreate(['name' => 'Admin']);
$perm = \App\Models\Permission::firstOrCreate(['name' => 'system.settings.update', 'module' => 'system']);
if (!$role->permissions->contains($perm)) {
    $role->permissions()->attach($perm);
}
if (!$user->roles->contains($role)) {
    $user->roles()->attach($role);
}

$controller = $app->make(\App\Modules\AI\Controllers\ChatController::class);

echo "1. Get available models...\n";
$req1 = \Illuminate\Http\Request::create('/api/v1/ai/models', 'GET');
$req1->setUserResolver(function() use ($user) { return $user; });
echo $controller->models($req1)->getContent() . "\n\n";

echo "2. Switch to qwen2.5:7b...\n";
$req2 = \Illuminate\Http\Request::create('/api/v1/ai/settings/model', 'PUT', ['model' => 'qwen2.5:7b']);
$req2->setUserResolver(function() use ($user) { return $user; });
echo $controller->updateModel($req2)->getContent() . "\n\n";

echo "3. Query AI (using qwen2.5:7b)...\n";
$req3 = \Illuminate\Http\Request::create('/api/v1/ai/chat', 'POST', ['messages' => [['role' => 'user', 'content' => 'Say the exact word "Acknowledged" and nothing else.']]]);
$req3->setUserResolver(function() use ($user) { return $user; });
echo $controller->chat($req3)->getContent() . "\n\n";

echo "4. Switch back to qwen2.5:3b...\n";
$req4 = \Illuminate\Http\Request::create('/api/v1/ai/settings/model', 'PUT', ['model' => 'qwen2.5:3b']);
$req4->setUserResolver(function() use ($user) { return $user; });
echo $controller->updateModel($req4)->getContent() . "\n\n";

echo "5. Query AI (using qwen2.5:3b)...\n";
$req5 = \Illuminate\Http\Request::create('/api/v1/ai/chat', 'POST', ['messages' => [['role' => 'user', 'content' => 'Say the exact word "Finished" and nothing else.']]]);
$req5->setUserResolver(function() use ($user) { return $user; });
echo $controller->chat($req5)->getContent() . "\n\n";
