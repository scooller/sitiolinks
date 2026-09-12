<?php

namespace App\Http\Controllers;

use App\Models\Cafe;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Generate and serve dynamic XML sitemap.
     */
    public function index(): Response
    {
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'https://only-models.online')), '/');

        $xml = Cache::remember('dynamic_sitemap_xml_' . md5($frontendUrl), 3600, function () use ($frontendUrl) {
            $urls = [];

            // 1. Static public core routes
            $staticRoutes = [
                ['path' => '/', 'priority' => '1.0', 'changefreq' => 'daily', 'lastmod' => now()->toIso8601String()],
                ['path' => '/explorar', 'priority' => '0.9', 'changefreq' => 'daily', 'lastmod' => now()->toIso8601String()],
                ['path' => '/cafes', 'priority' => '0.9', 'changefreq' => 'daily', 'lastmod' => now()->toIso8601String()],
                ['path' => '/ranking', 'priority' => '0.8', 'changefreq' => 'hourly', 'lastmod' => now()->toIso8601String()],
                ['path' => '/sugerir-cafe', 'priority' => '0.7', 'changefreq' => 'weekly', 'lastmod' => now()->toIso8601String()],
                ['path' => '/faqs', 'priority' => '0.7', 'changefreq' => 'weekly', 'lastmod' => now()->toIso8601String()],
                ['path' => '/contacto', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => now()->toIso8601String()],
                ['path' => '/privacidad-datos', 'priority' => '0.6', 'changefreq' => 'monthly', 'lastmod' => now()->toIso8601String()],
                ['path' => '/terminos-y-condiciones', 'priority' => '0.5', 'changefreq' => 'monthly', 'lastmod' => now()->toIso8601String()],
            ];

            foreach ($staticRoutes as $route) {
                $urls[] = [
                    'loc' => $frontendUrl . $route['path'],
                    'lastmod' => $route['lastmod'],
                    'changefreq' => $route['changefreq'],
                    'priority' => $route['priority'],
                ];
            }

            // 2. Dynamic creator profiles (role: creator, valid username)
            try {
                $creators = User::role('creator')
                    ->whereNotNull('username')
                    ->where('username', '!=', '')
                    ->select(['username', 'updated_at'])
                    ->get();

                foreach ($creators as $creator) {
                    $urls[] = [
                        'loc' => $frontendUrl . '/u/' . rawurlencode($creator->username),
                        'lastmod' => ($creator->updated_at ?: now())->toIso8601String(),
                        'changefreq' => 'weekly',
                        'priority' => '0.8',
                    ];
                }
            } catch (\Throwable $e) {
                // Fallback gracefully if role doesn't exist yet
            }

            // 3. Dynamic cafe detail pages
            try {
                $cafes = Cafe::select(['id', 'slug', 'updated_at'])->get();

                foreach ($cafes as $cafe) {
                    $identifier = $cafe->slug ?: $cafe->id;
                    $urls[] = [
                        'loc' => $frontendUrl . '/cafes/' . rawurlencode((string) $identifier),
                        'lastmod' => ($cafe->updated_at ?: now())->toIso8601String(),
                        'changefreq' => 'weekly',
                        'priority' => '0.8',
                    ];
                }
            } catch (\Throwable $e) {
                // Fallback gracefully if table not yet migrated
            }

            // Build XML output
            $xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>'];
            $xmlLines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

            foreach ($urls as $item) {
                $xmlLines[] = '  <url>';
                $xmlLines[] = '    <loc>' . htmlspecialchars($item['loc'], ENT_XML1, 'UTF-8') . '</loc>';
                if (! empty($item['lastmod'])) {
                    $xmlLines[] = '    <lastmod>' . $item['lastmod'] . '</lastmod>';
                }
                $xmlLines[] = '    <changefreq>' . $item['changefreq'] . '</changefreq>';
                $xmlLines[] = '    <priority>' . $item['priority'] . '</priority>';
                $xmlLines[] = '  </url>';
            }

            $xmlLines[] = '</urlset>';

            return implode("\n", $xmlLines);
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600, must-revalidate',
        ]);
    }
}
