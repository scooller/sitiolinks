<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Response;

class OpenGraphController extends Controller
{
    /**
     * Render crawler-friendly HTML with Open Graph & Twitter Cards metadata for a user profile.
     */
    public function user(string $username): Response
    {
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'https://only-models.online')), '/');
        $profileUrl = $frontendUrl . '/u/' . urlencode($username);

        $siteSettings = \App\Models\SiteSettings::first();
        $siteName = $siteSettings?->site_title ?: config('app.name', 'Only Models');
        if (trim($siteName) === '' || strcasecmp($siteName, 'Link Persons') === 0 || strcasecmp($siteName, 'laravel') === 0) {
            $siteName = 'Only Models';
        }

        $user = User::where('username', $username)->first();

        if (!$user) {
            return response(
                $this->renderHtml(
                    title: "Perfil no encontrado - {$siteName}",
                    description: 'Directorio internacional de creadores, modelos, escorts y damas de compañía.',
                    imageUrl: $frontendUrl . '/logo500.png',
                    canonicalUrl: $profileUrl,
                    fallbackUrl: $frontendUrl,
                    siteName: $siteName
                ),
                404,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        $displayName = $user->name ? "{$user->name} (@{$user->username})" : "@{$user->username}";
        $location = implode(', ', array_filter([$user->city, $user->country]));
        $priceStr = $user->price_from ? ' | Tarifa aprox: $' . number_format((float) $user->price_from, 0, ',', '.') . ($user->price_currency ? ' ' . $user->price_currency : '') . '/hr' : '';

        $title = "{$displayName}" . ($location ? " en {$location}" : "") . " | Creador Adulto (+18) & Escort - {$siteName}";
        $description = $user->description
            ? mb_substr($user->description, 0, 130) . ($priceStr ? " - {$priceStr}" : "") . " | Perfil verificado (+18) en {$siteName}."
            : "Perfil verificado (+18) de {$displayName}" . ($location ? " en {$location}" : "") . ". {$priceStr}. Redes sociales, OnlyFans, Arsmate y fotos exclusivas en {$siteName}.";

        // Obtener avatar absoluto del usuario, o como fallback el logo del sitio
        $avatarUrl = null;
        try {
            $avatarUrl = $user->getFirstMediaUrl('avatar') ?: $user->getFirstMediaUrl('avatar', 'thumb');
        } catch (\Throwable) {
            $avatarUrl = null;
        }

        if (!$avatarUrl) {
            try {
                $avatarUrl = $siteSettings?->getFirstMediaUrl('logo') ?: $siteSettings?->getFirstMediaUrl('default_avatar');
            } catch (\Throwable) {
                $avatarUrl = null;
            }
        }

        if (!$avatarUrl) {
            $avatarUrl = $frontendUrl . '/logo500.png';
        }

        $html = $this->renderHtml(
            title: $title,
            description: $description,
            imageUrl: $avatarUrl,
            canonicalUrl: $profileUrl,
            fallbackUrl: $profileUrl,
            username: $user->username,
            siteName: $siteName
        );

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'public, max-age=600',
        ]);
    }

    private function renderHtml(string $title, string $description, string $imageUrl, string $canonicalUrl, string $fallbackUrl, ?string $username = null, string $siteName = 'Only Models'): string
    {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $safeDesc = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
        $safeImg = htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8');
        $safeFallback = htmlspecialchars($fallbackUrl, ENT_QUOTES, 'UTF-8');
        $safeSiteName = htmlspecialchars($siteName, ENT_QUOTES, 'UTF-8');

        $profileUsernameTag = $username ? "<meta property=\"profile:username\" content=\"" . htmlspecialchars($username, ENT_QUOTES, 'UTF-8') . "\" />\n    " : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <title>{$safeTitle}</title>
    <meta name="description" content="{$safeDesc}" />
    <link rel="canonical" href="{$safeUrl}" />

    <!-- Open Graph -->
    <meta property="og:site_name" content="{$safeSiteName}" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="{$safeTitle}" />
    <meta property="og:description" content="{$safeDesc}" />
    <meta property="og:image" content="{$safeImg}" />
    <meta property="og:url" content="{$safeUrl}" />
    <meta property="og:locale" content="es" />
    {$profileUsernameTag}
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{$safeTitle}" />
    <meta name="twitter:description" content="{$safeDesc}" />
    <meta name="twitter:image" content="{$safeImg}" />

    <!-- Redirection for human browsers -->
    <meta http-equiv="refresh" content="0;url={$safeFallback}" />
    <script>window.location.replace("{$safeFallback}");</script>
</head>
<body>
    <p>Redirigiendo al perfil de <a href="{$safeFallback}">{$safeTitle}</a>...</p>
</body>
</html>
HTML;
    }
}
