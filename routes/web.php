<?php

use App\Http\Controllers\MediaController;
use App\Http\Controllers\OpenGraphController;
use App\Http\Controllers\SitemapController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/admin');
});

Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/api/og/user/{username}', [OpenGraphController::class, 'user'])->name('og.user');
Route::get('/share/u/{username}', [OpenGraphController::class, 'user'])->name('share.user');

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    // Redirect to frontend with success message
    return redirect(config('app.frontend_url') . '/email-verified?success=true');
})->middleware(['auth:web', 'signed'])->name('verification.verify');

Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth:web')->name('verification.notice');

// Gallery media routes with authorization
Route::middleware(['web'])->group(function () {
    Route::get('/gallery-media/{media}', [MediaController::class, 'serveGalleryMedia'])
        ->name('gallery.media');
    Route::get('/gallery-media/{media}/{conversion}', [MediaController::class, 'serveGalleryMediaConversion'])
        ->name('gallery.media.conversion');

    // Cafe media routes (public)
    Route::match(['get', 'options'], '/cafe-media/{media}', [MediaController::class, 'serveCafeMedia'])
        ->name('cafe.media');
    Route::match(['get', 'options'], '/cafe-media/{media}/{conversion}', [MediaController::class, 'serveCafeMediaConversion'])
        ->name('cafe.media.conversion');

    // Cafe branch media routes (public)
    Route::match(['get', 'options'], '/branch-media/{media}', [MediaController::class, 'serveBranchMedia'])
        ->name('branch.media');
    Route::match(['get', 'options'], '/branch-media/{media}/{conversion}', [MediaController::class, 'serveBranchMediaConversion'])
        ->name('branch.media.conversion');
});
