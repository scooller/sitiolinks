<?php

use App\Http\Controllers\MediaController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return redirect('/admin');
});

// Email Verification Routes
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    // Redirect to frontend with success message
    return redirect(config('app.frontend_url').'/email-verified?success=true');
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
});

// Debug routes
/*
Route::get('/debug/session', function (Request $request) {
    $request->session()->put('probe', 'ok');
    return response()->json([
        'session_id' => $request->session()->getId(),
        'probe' => $request->session()->get('probe'),
        'has_cookie' => $request->hasCookie(config('session.cookie')),
        'cookie_name' => config('session.cookie'),
    ]);
});

Route::get('/debug/auth', function (Request $request) {
    $user = Auth::guard('web')->user();
    return response()->json([
        'auth_check' => Auth::guard('web')->check(),
        'user_id' => $user?->id,
        'email' => $user?->email,
        'roles' => $user?->getRoleNames(),
    ]);
});*/

Route::get('/debug/headers', function (Request $request) {
    return response()->json([
        'ip' => $request->ip(),
        'cf_ipcountry' => $request->header('CF-IPCountry'),
        'x_country_code' => $request->header('X-Country-Code'),
        'x_forwarded_for' => $request->header('X-Forwarded-For'),
        'user_agent' => $request->userAgent(),
    ]);
})->middleware('auth:web')->name('debug.headers');
