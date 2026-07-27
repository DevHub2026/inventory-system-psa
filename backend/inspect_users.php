<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== ALL USERS ===\n";
$users = App\Models\User::all(['id', 'employee_number', 'email', 'first_name', 'last_name', 'department_id']);
foreach ($users as $u) {
    $emp = $u->employee_number ?? 'null';
    $email = $u->email ?? 'null';
    $fn = $u->first_name ?? '';
    $ln = $u->last_name ?? '';
    $dept = $u->department_id ?? 'null';
    echo "ID: {$u->id} | EMP: '{$emp}' | EMAIL: {$email} | NAME: {$fn} {$ln} | DEPT: {$dept}\n";
}
echo "Total: " . App\Models\User::count() . "\n\n";

echo "=== DEPARTMENTS ===\n";
$depts = App\Models\Department::all(['id', 'name', 'description']);
foreach ($depts as $d) {
    echo "ID: {$d->id} | NAME: {$d->name} | DESC: {$d->description}\n";
}
echo "Total: " . App\Models\Department::count() . "\n\n";

echo "=== OFFICES ===\n";
$offices = App\Models\Office::all(['id', 'name', 'code']);
foreach ($offices as $o) {
    echo "ID: {$o->id} | NAME: {$o->name} | CODE: {$o->code}\n";
}
echo "Total: " . App\Models\Office::count() . "\n\n";

echo "=== DUPLICATE EMPLOYEE_NUMBERS ===\n";
$dups = DB::table('users')
    ->select('employee_number', DB::raw('COUNT(*) as count'))
    ->whereNotNull('employee_number')
    ->groupBy('employee_number')
    ->having('count', '>', 1)
    ->get();
foreach ($dups as $d) {
    echo "EMP: '{$d->employee_number}' | COUNT: {$d->count}\n";
}
if ($dups->isEmpty()) echo "No duplicates found.\n";

echo "\n=== NULL EMPLOYEE_NUMBERS ===\n";
$nullEmps = App\Models\User::whereNull('employee_number')->get(['id', 'email', 'first_name', 'last_name']);
foreach ($nullEmps as $u) {
    echo "ID: {$u->id} | EMAIL: {$u->email} | NAME: {$u->first_name} {$u->last_name}\n";
}
if ($nullEmps->isEmpty()) echo "None found.\n";
