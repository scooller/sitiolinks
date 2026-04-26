<?php

use App\Http\Controllers\Api\AltchaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvatarUploadController;
use App\Http\Controllers\Api\CafeMediaUploadController;
use App\Http\Controllers\Api\GalleryMediaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:web');
Route::get('/altcha/challenge', [AltchaController::class, 'challenge']);
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:web');
Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->middleware('auth:web');

// Broadcasting auth
Broadcast::routes(['middleware' => ['auth:web']]);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:web');

// Gallery media (user-owned) uploads
Route::post('/gallery-media/upload', [GalleryMediaController::class, 'upload'])->middleware('auth:web');
Route::delete('/gallery-media/revert', [GalleryMediaController::class, 'revert'])->middleware('auth:web');

// Avatar uploads
Route::post('/avatar/upload', [AvatarUploadController::class, 'upload'])->middleware('auth:web');
Route::delete('/avatar/revert', [AvatarUploadController::class, 'revert'])->middleware('auth:web');

// Cafe media uploads
Route::post('/cafe-media/upload-cafe-image', [CafeMediaUploadController::class, 'uploadCafeImage'])->middleware('auth:web');
Route::post('/cafe-media/upload-branch-image', [CafeMediaUploadController::class, 'uploadBranchImage'])->middleware('auth:web');
Route::delete('/cafe-media/revert', [CafeMediaUploadController::class, 'revert'])->middleware('auth:web');
