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

        $user = User::where('username', $username)->first();

        if (!$user) {
            return response(
                $this->renderHtml(
                    title: 'Perfil no encontrado - Link Persons',
                    description: 'Directorio internacional de creadores, modelos, escorts y damas de compañía.',
                    imageUrl: $frontendUrl . '/logo500.png',
                    canonicalUrl: $profileUrl,
                    fallbackUrl: $frontendUrl
                ),
                404,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        $displayName = $user->name ? "{$user->name} (@{$user->username})" : "@{$user->username}";
        $title = "{$displayName} - Link Persons";
        $description = $user->description
            ? mb_substr($user->description, 0, 160)
            : "Conoce el perfil oficial de {$displayName} en Link Persons. Enlaces exclusivos, fotos y contenido verificado.";

        // Obtener avatar absoluto del usuario
        $avatarUrl = null;
        try {
            $avatarUrl = $user->getFirstMediaUrl('avatar') ?: $user->getFirstMediaUrl('avatar', 'thumb');
        } catch (\Throwable) {
            $avatarUrl = null;
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
            username: $user->username
        );

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'public, max-age=600',
        ]);
    }

    private function renderHtml(string $title, string $description, string $imageUrl, string $canonicalUrl, string $fallbackUrl, ?string $username = null): string
    {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $safeDesc = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
        $safeImg = htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8');
        $safeFallback = htmlspecialchars($fallbackUrl, ENT_QUOTES, 'UTF-8');

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
    <meta property="og:site_name" content="Link Persons" />
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
