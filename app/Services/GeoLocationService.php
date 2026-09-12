<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeoLocationService
{
    /**
     * Common VPN / Datacenter ASN or organization signatures.
     */
    protected const HOSTING_SIGNATURES = [
        'm247',
        'datacamp',
        'cdn77',
        'choopa',
        'vultr',
        'digitalocean',
        'hetzner',
        'linode',
        'akamai',
        'ovh',
        'amazon',
        'aws',
        'google',
        'microsoft',
        'azure',
        'oracle',
        'leaseweb',
        'quadranet',
        'mullvad',
        'proton',
        'nordvpn',
        'surfshark',
        'expressvpn',
        'tor exit',
        'pango',
        'anchorfree',
        'hostinger',
    ];

    /**
     * Get the real client IP address.
     */
    public function getClientIp(): string
    {
        // 1. In local or testing environments, allow manual IP simulation
        if (app()->environment('local', 'testing')) {
            $testIp = request()->header('X-Test-IP');
            if ($testIp && filter_var($testIp, FILTER_VALIDATE_IP)) {
                return (string) $testIp;
            }
        }

        // 2. Cloudflare Connecting IP
        $cfIp = request()->header('CF-Connecting-IP');
        if ($cfIp && filter_var($cfIp, FILTER_VALIDATE_IP)) {
            return (string) $cfIp;
        }

        // 3. X-Forwarded-For header (first public IP)
        $xff = request()->header('X-Forwarded-For');
        if ($xff) {
            $ips = explode(',', (string) $xff);
            foreach ($ips as $candidate) {
                $candidate = trim($candidate);
                if (filter_var($candidate, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $candidate;
                }
            }
        }

        // 4. Default framework IP
        return (string) request()->ip();
    }

    /**
     * Resolve IP intelligence: country, VPN/proxy flag, and provider organization.
     * Results are cached for 24 hours per IP.
     */
    public function getClientIntel(): array
    {
        // In local/testing, allow direct header simulation for quick testing
        if (app()->environment('local', 'testing')) {
            $testCountry = request()->header('X-Test-Country');
            $testVpn = request()->header('X-Test-VPN');

            if ($testCountry !== null || $testVpn !== null) {
                return [
                    'ip' => $this->getClientIp(),
                    'country' => strtoupper(trim((string) $testCountry)),
                    'is_vpn' => in_array(strtolower((string) $testVpn), ['1', 'true', 'yes', 'on'], true),
                    'org' => 'Simulated Test Environment',
                    'reason' => 'test_override',
                ];
            }
        }

        $ip = $this->getClientIp();

        // If it's a private or loopback IP (local dev without test headers)
        $isPrivate = ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
        if ($isPrivate) {
            return [
                'ip' => $ip,
                'country' => strtoupper((string) (request()->header('CF-IPCountry') ?: request()->header('X-Country-Code') ?: '')),
                'is_vpn' => false,
                'org' => 'Private/Loopback Network',
                'reason' => 'private_ip',
            ];
        }

        return Cache::remember('ip_intel_' . md5($ip), now()->addHours(24), function () use ($ip) {
            return $this->lookupIp($ip);
        });
    }

    /**
     * Perform external IP intelligence lookup with fallback.
     */
    protected function lookupIp(string $ip): array
    {
        $country = strtoupper((string) (request()->header('CF-IPCountry') ?: request()->header('X-Country-Code') ?: ''));
        $isVpn = false;
        $org = '';
        $reason = 'none';

        // Provider 1: ip-api.com (includes proxy and hosting detection)
        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}?fields=status,message,countryCode,proxy,hosting,as,org");
            if ($response->ok() && $response->json('status') === 'success') {
                $data = $response->json();
                if (! $country && ! empty($data['countryCode'])) {
                    $country = strtoupper((string) $data['countryCode']);
                }

                $org = (string) ($data['org'] ?? $data['as'] ?? '');
                $proxyFlag = (bool) ($data['proxy'] ?? false);
                $hostingFlag = (bool) ($data['hosting'] ?? false);

                if ($proxyFlag) {
                    $isVpn = true;
                    $reason = 'proxy_vpn_flag';
                } elseif ($hostingFlag) {
                    $isVpn = true;
                    $reason = 'datacenter_hosting_flag';
                } else {
                    // Check against known datacenter/VPN ASN signatures
                    $lowerOrg = strtolower($org);
                    foreach (self::HOSTING_SIGNATURES as $sig) {
                        if (str_contains($lowerOrg, $sig)) {
                            $isVpn = true;
                            $reason = 'signature_match_' . $sig;
                            break;
                        }
                    }
                }

                return [
                    'ip' => $ip,
                    'country' => $country,
                    'is_vpn' => $isVpn,
                    'org' => $org,
                    'reason' => $reason,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("GeoLocationService: ip-api.com failed for {$ip}: " . $e->getMessage());
        }

        // Provider 2 fallback: ipapi.co
        try {
            $response2 = Http::timeout(3)->get("https://ipapi.co/{$ip}/json/");
            if ($response2->ok()) {
                $data2 = $response2->json();
                if (! $country && ! empty($data2['country'])) {
                    $country = strtoupper((string) $data2['country']);
                }
                $org = (string) ($data2['org'] ?? $data2['asn'] ?? '');
                $lowerOrg = strtolower($org);

                foreach (self::HOSTING_SIGNATURES as $sig) {
                    if (str_contains($lowerOrg, $sig)) {
                        $isVpn = true;
                        $reason = 'signature_match_' . $sig;
                        break;
                    }
                }

                return [
                    'ip' => $ip,
                    'country' => $country,
                    'is_vpn' => $isVpn,
                    'org' => $org,
                    'reason' => $reason,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("GeoLocationService: ipapi.co failed for {$ip}: " . $e->getMessage());
        }

        return [
            'ip' => $ip,
            'country' => $country,
            'is_vpn' => false,
            'org' => 'Unknown',
            'reason' => 'lookup_failed',
        ];
    }

    /**
     * Determine if a target user's profile should be blocked for the current viewer.
     */
    public function shouldBlockUser(User $targetUser, ?User $currentUser = null): bool
    {
        // 1. Creator looking at own profile: NEVER blocked
        if ($currentUser && $currentUser->id === $targetUser->id) {
            return false;
        }

        // 2. Administrators or moderators: NEVER blocked (supervisory access)
        if ($currentUser && $currentUser->hasAnyRole(['admin', 'super_admin', 'moderator'])) {
            return false;
        }

        // 3. If target user does not have country_block active: NEVER blocked
        if (! $targetUser->country_block) {
            return false;
        }

        $intel = $this->getClientIntel();

        // 4. If visitor is using a VPN, Proxy, Tor, or Datacenter IP:
        // AUTOMATICALLY BLOCK! Users cannot bypass country block by turning on a VPN.
        if (! empty($intel['is_vpn'])) {
            return true;
        }

        // 5. Target country comparison (fallback to nationality if country is not set)
        $targetCountry = strtoupper((string) ($targetUser->country ?: $targetUser->nationality ?: ''));
        $viewerCountry = $intel['country'];

        if ($viewerCountry && $targetCountry && ($viewerCountry === $targetCountry)) {
            return true;
        }

        return false;
    }

    /**
     * Apply country block filtering to an Eloquent User query.
     */
    public function applyCountryBlockScope(Builder $query, ?User $currentUser = null): Builder
    {
        // Admins and moderators see all creators
        if ($currentUser && $currentUser->hasAnyRole(['admin', 'super_admin', 'moderator'])) {
            return $query;
        }

        $intel = $this->getClientIntel();
        $isVpn = ! empty($intel['is_vpn']);
        $viewerCountry = $intel['country'];
        $currentUserId = $currentUser ? $currentUser->id : null;

        return $query->where(function (Builder $w) use ($isVpn, $viewerCountry, $currentUserId) {
            // Own profile is always visible if authenticated
            if ($currentUserId) {
                $w->where('id', $currentUserId)->orWhere(function (Builder $sub) use ($isVpn, $viewerCountry) {
                    $this->buildBlockFilter($sub, $isVpn, $viewerCountry);
                });
            } else {
                $this->buildBlockFilter($w, $isVpn, $viewerCountry);
            }
        });
    }

    /**
     * Helper to build the block filter rules.
     */
    protected function buildBlockFilter(Builder $w, bool $isVpn, string $viewerCountry): void
    {
        if ($isVpn) {
            // If viewer is on a VPN, hide ALL users who have country_block enabled
            $w->where(function (Builder $q) {
                $q->where('country_block', false)
                  ->orWhereNull('country_block');
            });
        } elseif ($viewerCountry) {
            // If viewer is residential and country is known, hide users whose country or nationality matches
            $w->where(function (Builder $q) use ($viewerCountry) {
                $q->where(function (Builder $noBlock) {
                    $noBlock->where('country_block', false)
                            ->orWhereNull('country_block');
                })->orWhere(function (Builder $blockedDifferentCountry) use ($viewerCountry) {
                    $blockedDifferentCountry->where('country_block', true)
                        ->where(function (Builder $countryCheck) use ($viewerCountry) {
                            $countryCheck->where(function (Builder $c) use ($viewerCountry) {
                                $c->whereNotNull('country')
                                  ->where('country', '!=', '')
                                  ->where('country', '!=', $viewerCountry);
                            })->orWhere(function (Builder $n) use ($viewerCountry) {
                                $n->where(function (Builder $emptyC) {
                                    $emptyC->whereNull('country')
                                           ->orWhere('country', '');
                                })
                                ->whereNotNull('nationality')
                                ->where('nationality', '!=', $viewerCountry);
                            });
                        });
                });
            });
        } else {
            // If country cannot be determined and not VPN, only show users without country_block
            $w->where(function (Builder $q) {
                $q->where('country_block', false)
                  ->orWhereNull('country_block');
            });
        }
    }
}
