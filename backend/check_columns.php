<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$columns = Illuminate\Support\Facades\Schema::getColumnListing('users');
echo "Users table columns:\n";
foreach ($columns as $col) {
    echo "  - {$col}\n";
}
