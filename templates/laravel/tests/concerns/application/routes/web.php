<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', fn () => view('welcome'));
Route::get('/phpinfo', fn () => phpinfo());
Route::get('/log', fn () => Log::error('Woops, something went wrong.'));
Route::get('/job', function () {
    dispatch(fn () => Log::notice('Queued job executed.'));
    return 'job pushed';
});
