<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Mail\ContactMessageAutoReply;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Support\Captcha;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class CreateContactMessageMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createContactMessage',
        'description' => 'Crear un mensaje de contacto público',
    ];

    public function type(): Type
    {
        return GraphQL::type('ContactMessage');
    }

    public function args(): array
    {
        return [
            'name' => ['type' => Type::nonNull(Type::string()), 'description' => 'Nombre del remitente'],
            'email' => ['type' => Type::nonNull(Type::string()), 'description' => 'Email del remitente'],
            'subject' => ['type' => Type::nonNull(Type::string()), 'description' => 'Asunto del mensaje'],
            'message' => ['type' => Type::nonNull(Type::string()), 'description' => 'Contenido del mensaje'],
            // Honeypot simple: si viene con valor se rechaza
            'website' => ['type' => Type::string(), 'description' => 'Honeypot (debe estar vacío)', 'defaultValue' => ''],
            'captcha' => ['type' => Type::string(), 'description' => 'Token de reCAPTCHA o payload (opcional)'],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        Log::info('CreateContactMessage called', ['args' => $args]);

        // Honeypot
        if (! empty($args['website'] ?? '')) {
            Log::warning('Honeypot triggered', ['website' => $args['website']]);
            throw new \Exception('Invalid submission.');
        }

        // Captcha verification (only if enabled for current provider)
        $provider = config('services.captcha.provider', 'recaptcha');
        $isEnabled = ($provider === 'recaptcha') ? (bool) config('services.recaptcha.enabled') : (bool) config('services.altcha.enabled');
        $remoteIp = request()->ip();
        if ($isEnabled && ! Captcha::verify($args['captcha'] ?? null)) {
            throw new \Exception('Captcha inválido. Por favor, intenta nuevamente.');
        }

        // Rate limit by IP: 5 per hour
        $ip = request()->ip() ?: 'unknown';
        $key = sprintf('contact_message:%s', $ip);
        if (! RateLimiter::attempt($key, 5, fn () => null, 3600)) {
            Log::warning('Rate limit exceeded', ['ip' => $ip]);
            throw new \Exception('Has alcanzado el límite de envíos. Intenta nuevamente más tarde.');
        }

        // Validate
        $validator = Validator::make($args, [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'subject' => ['required', 'string', 'min:3', 'max:190'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);
        $validator->validate();

        $user = auth('web')->user();

        $message = ContactMessage::create([
            'name' => $args['name'],
            'email' => $args['email'],
            'subject' => $args['subject'],
            'message' => $args['message'],
            'status' => ContactMessage::STATUS_NEW,
            'ip_address' => $ip,
            'user_agent' => substr((string) request()->userAgent(), 0, 2000),
            'user_id' => $user?->id,
        ]);

        Log::info('Message created', ['id' => $message->id]);

        // Enviar emails
        try {
            // Notificar a admin (o lista de admins desde config)
            $adminEmail = config('mail.admin_contact_email', config('mail.from.address'));
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new ContactMessageReceived($message));
                Log::info('Admin email queued', ['to' => $adminEmail]);
            }

            // Auto-reply al remitente
            Mail::to($message->email)->send(new ContactMessageAutoReply($message));
            Log::info('Auto-reply queued', ['to' => $message->email]);
        } catch (\Exception $e) {
            // Log error but don't fail the mutation
            Log::error('Error sending contact emails: '.$e->getMessage());
        }

        return $message;
    }
}
