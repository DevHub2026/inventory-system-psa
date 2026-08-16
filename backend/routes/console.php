<?php

use App\Console\Commands\CheckInsuranceExpiration;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('insurance:check-expiration')->daily();
Schedule::command('borrowings:send-overdue-reminders')->daily();
Schedule::command('inventory:send-low-stock-alerts')->dailyAt('07:00');
Schedule::command('maintenance:send-reminders')->dailyAt('07:15');
