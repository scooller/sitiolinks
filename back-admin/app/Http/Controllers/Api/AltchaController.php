<?php

namespace App\Http\Controllers\Api;

use AltchaOrg\Altcha\Altcha;
use AltchaOrg\Altcha\ChallengeOptions;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AltchaController extends Controller
{
    public function challenge(Request $request)
    {
        $secret = config('services.altcha.secret');

        if (! $secret) {
            Log::warning('Altcha secret not configured');

            return response()->json(['error' => 'Altcha not configured'], 500);
        }

        if (! class_exists(Altcha::class)) {
            Log::warning('Altcha lib not installed');

            return response()->json(['error' => 'Altcha lib not installed'], 500);
        }

        try {
            $altcha = new Altcha($secret);

            $options = new ChallengeOptions(maxNumber: 50000);
            $challenge = $altcha->createChallenge($options);

            return response()->json($challenge);
        } catch (\Throwable $e) {
            Log::error('Altcha challenge failed: '.$e->getMessage());

            return response()->json(['error' => 'Altcha challenge failed'], 500);
        }
    }
}
