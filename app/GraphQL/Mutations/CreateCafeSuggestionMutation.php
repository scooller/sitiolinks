<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Mail\CafeSuggestionReceived;
use App\Models\CafeSuggestion;
use App\Support\Captcha;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Rebing\GraphQL\Support\Mutation;

class CreateCafeSuggestionMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createCafeSuggestion',
        'description' => 'Sugerir un café/sucursal para el directorio (queda pendiente de aprobación)',
    ];

    public function type(): Type
    {
        return Type::boolean();
    }

    public function args(): array
    {
        return [
            'name' => ['type' => Type::nonNull(Type::string()), 'description' => 'Nombre del café'],
            'city' => ['type' => Type::string(), 'description' => 'Ciudad'],
            'address' => ['type' => Type::string(), 'description' => 'Dirección'],
            'website' => ['type' => Type::string(), 'description' => 'Website'],
            'google_maps_url' => ['type' => Type::string(), 'description' => 'URL de Google Maps'],
            'notes' => ['type' => Type::string(), 'description' => 'Notas adicionales'],
            'captcha' => ['type' => Type::string(), 'description' => 'Payload de ALTCHA (opcional)'],
        ];
    }

    public function resolve($root, array $args): bool
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        // Rate limit: 5 sugerencias por usuario por hora
        $key = sprintf('cafe_suggestion:%d', $user->id);
        if (! RateLimiter::attempt($key, 5, fn () => null, 3600)) {
            throw new UserError('Has alcanzado el límite de sugerencias. Intenta más tarde.');
        }

        // Verificación captcha (se omite si ALTCHA está deshabilitado)
        if (! Captcha::verify($args['captcha'] ?? null)) {
            throw new UserError('Captcha inválido. Por favor, intenta nuevamente.');
        }

        Validator::make($args, [
            'name' => ['required', 'string', 'min:2', 'max:190'],
            'city' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'google_maps_url' => ['nullable', 'url', 'max:500'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ])->validate();

        $suggestion = CafeSuggestion::create([
            ...collect($args)->only(['name', 'city', 'address', 'website', 'google_maps_url', 'notes'])->all(),
            'user_id' => $user->id,
            'status' => CafeSuggestion::STATUS_PENDING,
        ]);

        try {
            $adminEmail = config('mail.admin_contact_email', config('mail.from.address'));
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new CafeSuggestionReceived($suggestion));
            }
        } catch (\Exception $e) {
            Log::error('Error sending cafe suggestion email: '.$e->getMessage());
        }

        return true;
    }
}
