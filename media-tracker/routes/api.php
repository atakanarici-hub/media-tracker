<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\PostController;

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Herkese açık endpoint'ler (dakikada 30 istek limiti)
Route::middleware('throttle:30,1')->group(function () {
    Route::get('/media/search', [MediaController::class, 'search']);
    Route::get('/media/{type}/{id}', [MediaController::class, 'details']);
    Route::get('/media/tv/{id}/season/{seasonNumber}', [MediaController::class, 'getSeasonDetails']);
    Route::get('/posts', [PostController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // İlerleme ve Takip
    Route::get('/progress', [ProgressController::class, 'getProgress']);
    Route::get('/progress/{media}', [ProgressController::class, 'getMediaProgress']);
    Route::post('/progress/{media}', [ProgressController::class, 'updateProgress']);
    Route::delete('/progress/{media}', [ProgressController::class, 'deleteProgress']);
    Route::get('/progress/{media}/episodes', [ProgressController::class, 'getEpisodes']);
    Route::post('/progress/{media}/episode', [ProgressController::class, 'updateEpisodeProgress']);

    // Sosyal Medya
    Route::post('/posts', [PostController::class, 'store']);
});
