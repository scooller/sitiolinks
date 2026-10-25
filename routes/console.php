<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Usa Schedule::call para ejecutar in-process sin requerir proc_open en hosting compartido
Schedule::call(fn () => Artisan::call('emails:process-campaigns'))->everyMinute()->name('emails:process-campaigns');
