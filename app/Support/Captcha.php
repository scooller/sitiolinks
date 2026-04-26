<?php

namespace App\Support;

use AltchaOrg\Altcha\Altcha;
use Illuminate\Support\Facades\Log;

class Captcha
{
    public static function verify(?string $token): bool
    {
        if (! config('services.altcha.enabled')) {
            return true; // Skip verification if disabled
        }

        if (empty($token)) {
            return false;
        }

        // ALTCHA verification (local)
        if (! class_exists(Altcha::class)) {
            throw new \Exception('ALTCHA library not installed. Run: composer require altcha-org/altcha');
        }

        $secret = config('services.altcha.secret');
        if (empty($secret)) {
            throw new \Exception('ALTCHA_SECRET not configured in .env');
        }

        try {
            $altcha = new Altcha($secret);
            // verifySolution returns true/false or payload; we return boolean
            $verified = $altcha->verifySolution($token, true);

            return (bool) $verified;

            return $payload !== null; // Valid if payload is returned
        } catch (\Exception $e) {
            Log::error('ALTCHA verification failed: '.$e->getMessage());

            return false;
        }
    }
}
