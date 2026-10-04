<?php

use App\Http\Controllers\Api\AltchaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvatarUploadController;
use App\Http\Controllers\Api\CafeMediaUploadController;
use App\Http\Controllers\Api\GalleryMediaController;
use App\Http\Controllers\Api\MagicLinkController;
use App\Http\Controllers\Api\ManagerController;
use App\Http\Controllers\Api\VerificationDocumentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:web');
Route::get('/altcha/challenge', [AltchaController::class, 'challenge'])->middleware('throttle:30,1');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:web');
Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->middleware(['auth:web', 'throttle:5,1']);

// Magic Link (creator first login)
Route::get('/magic-link/{token}', [MagicLinkController::class, 'consume'])->middleware('throttle:10,1');
Route::post('/magic-link/set-password', [MagicLinkController::class, 'setPassword'])->middleware(['auth:web']);
Route::post('/auth/magic-link', [MagicLinkController::class, 'consume'])->middleware('throttle:10,1');
Route::post('/auth/magic-link/set-password', [MagicLinkController::class, 'setPassword'])->middleware(['auth:web']);

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

// Documentos de verificación +18 (KYC creadores y managers)
Route::prefix('verification-documents')->middleware('auth:web')->group(function () {
    Route::get('/status', [VerificationDocumentController::class, 'status']);
    Route::post('/upload', [VerificationDocumentController::class, 'upload'])->middleware('throttle:30,1');
    Route::delete('/{collection}', [VerificationDocumentController::class, 'deleteDocument'])->middleware('throttle:30,1');
});

// ─── Manager API ─────────────────────────────────────────────────────────────
Route::prefix('manager')->middleware(['auth:web'])->group(function () {
    // Profile
    Route::get('/profile', [ManagerController::class, 'getProfile']);
    Route::post('/profile', [ManagerController::class, 'createProfile']);
    Route::put('/profile', [ManagerController::class, 'updateProfile']);

    // Creators
    Route::get('/creators', [ManagerController::class, 'listCreators']);
    Route::post('/creators', [ManagerController::class, 'createCreator']);
    Route::put('/creators/{id}', [ManagerController::class, 'updateCreator']);
    Route::delete('/creators/{id}', [ManagerController::class, 'deleteCreator']);
    Route::put('/creators/{id}/avatar', [ManagerController::class, 'updateCreatorAvatar']);
    Route::post('/creators/{id}/tags', [ManagerController::class, 'syncCreatorTags']);
    Route::post('/creators/{id}/notify', [ManagerController::class, 'notifyCreator']);
    Route::match(['get', 'post'], '/creators/{id}/magic-link', [ManagerController::class, 'regenerateMagicLink']);

    // Documents
    Route::post('/creators/{id}/documents/{docId}/upload', [ManagerController::class, 'uploadDocument']);

    // Tags
    Route::post('/tags', [ManagerController::class, 'createTag']);

    // Café
    Route::get('/cafe', [ManagerController::class, 'getCafe']);
    Route::put('/cafe', [ManagerController::class, 'updateCafe']);
    Route::post('/cafe/creators/{userId}', [ManagerController::class, 'addCreatorToCafe']);
    Route::delete('/cafe/creators/{userId}', [ManagerController::class, 'removeCreatorFromCafe']);
});
