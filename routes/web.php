<?php

use App\Http\Controllers\Web\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/school-panel/{any?}', function () {
    return view('school-panel.dashboard');
})->where('any', '.*');