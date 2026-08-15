<?php

namespace Tests\Feature;

use AltchaOrg\Altcha\Hasher\Algorithm;
use AltchaOrg\Altcha\Hasher\Hasher;
use App\Support\Captcha;
use Tests\TestCase;

class CaptchaTest extends TestCase
{
    private const SECRET = 'test-secret-key';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.altcha.enabled' => true,
            'services.altcha.secret' => self::SECRET,
        ]);
    }

    public function test_verify_returns_true_when_altcha_is_disabled(): void
    {
        config(['services.altcha.enabled' => false]);

        $this->assertTrue(Captcha::verify(null));
        $this->assertTrue(Captcha::verify('anything'));
    }

    public function test_verify_rejects_empty_token_when_enabled(): void
    {
        $this->assertFalse(Captcha::verify(null));
        $this->assertFalse(Captcha::verify(''));
    }

    public function test_verify_rejects_malformed_token(): void
    {
        $this->assertFalse(Captcha::verify('not-base64-json'));
        $this->assertFalse(Captcha::verify(base64_encode(json_encode(['foo' => 'bar']))));
    }

    public function test_verify_accepts_valid_solution(): void
    {
        $payload = $this->buildPayload(self::SECRET);

        $this->assertTrue(Captcha::verify($payload));
    }

    public function test_verify_rejects_solution_signed_with_other_secret(): void
    {
        $payload = $this->buildPayload('other-secret');

        $this->assertFalse(Captcha::verify($payload));
    }

    public function test_verify_rejects_tampered_number(): void
    {
        $payload = $this->buildPayload(self::SECRET, 99);

        $this->assertFalse(Captcha::verify($payload));
    }

    /**
     * Construye un payload de solución ALTCHA válido con crypto real.
     * El salt lleva el sufijo "&" que BaseChallengeOptions añade como
     * delimitador anti-splicing de parámetros.
     */
    private function buildPayload(string $secret, ?int $solvedNumber = null): string
    {
        $hasher = new Hasher;
        $algorithm = Algorithm::SHA256;
        $salt = 'testsalt&';
        $number = 42;

        $challenge = $hasher->hashHex($algorithm, $salt . $number);
        $signature = $hasher->hashHmacHex($algorithm, $challenge, $secret);

        return base64_encode(json_encode([
            'algorithm' => $algorithm->value,
            'challenge' => $challenge,
            'number' => $solvedNumber ?? $number,
            'salt' => $salt,
            'signature' => $signature,
        ]));
    }
}
