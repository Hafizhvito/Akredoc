<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\DocumentConverterService;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(DocumentConverterService::class, function ($app) {
            return new DocumentConverterService();
        });
    }

    public function boot()
    {
        //
    }
}
