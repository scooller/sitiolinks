<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Carbon\Carbon;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class UpdateProfileMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateProfile',
        'description' => 'Actualizar perfil del usuario autenticado',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'name' => [
                'type' => Type::string(),
                'description' => 'Nombre completo del usuario',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => 'Descripción del perfil',
            ],
            'nationality' => [
                'type' => Type::string(),
                'description' => 'Nacionalidad',
            ],
            'country' => [
                'type' => Type::string(),
                'description' => 'País de residencia',
            ],
            'city' => [
                'type' => Type::string(),
                'description' => 'Ciudad',
            ],
            'gender' => [
                'type' => Type::string(),
                'description' => 'Género (hombre, mujer, trans, otro)',
            ],
            'birth_date' => [
                'type' => Type::string(),
                'description' => 'Fecha de nacimiento (YYYY-MM-DD)',
            ],
            'price_from' => [
                'type' => Type::float(),
                'description' => 'Precio desde (solo para creadores)',
            ],
            'country_block' => [
                'type' => Type::boolean(),
                'description' => 'Activar bloqueo por país',
            ],
            'card_bg_color' => [
                'type' => Type::string(),
                'description' => 'Color de fondo de la card en formato HEX (#RRGGBB)',
            ],
            'card_bg_opacity' => [
                'type' => Type::float(),
                'description' => 'Opacidad del fondo de la card en el perfil (0.1-1)',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $currentUser = auth('web')->user();

        if (! $currentUser) {
            throw new \Exception('Debes estar autenticado para actualizar tu perfil.');
        }

        // Validar género si se proporciona
        if (isset($args['gender'])) {
            $validGenders = ['hombre', 'mujer', 'trans', 'otro'];
            if (! in_array($args['gender'], $validGenders)) {
                throw new \Exception('Género no válido. Opciones: hombre, mujer, trans, otro.');
            }
        }

        // Validar fecha de nacimiento (mayor de 18 años) si se proporciona
        if (isset($args['birth_date'])) {
            $birthDate = Carbon::parse($args['birth_date']);
            $eighteenYearsAgo = Carbon::now()->subYears(18);

            if ($birthDate->isAfter($eighteenYearsAgo)) {
                throw new \Exception('Debes ser mayor de 18 años.');
            }
        }

        // Solo permitir price_from si el usuario es creador
        if (isset($args['price_from']) && ! $currentUser->hasRole('creator')) {
            throw new \Exception('Solo los creadores pueden establecer un precio.');
        }

        // Validar color si se proporciona (hex #RGB o #RRGGBB o sin #)
        if (isset($args['card_bg_color']) && $args['card_bg_color'] !== null && $args['card_bg_color'] !== '') {
            $color = ltrim(trim((string) $args['card_bg_color']), '#');
            if (! preg_match('/^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/', $color)) {
                throw new \Exception('El color debe ser un HEX válido (#RGB o #RRGGBB).');
            }
            $args['card_bg_color'] = '#'.$color;
        }
        if (isset($args['card_bg_opacity'])) {
            $opacity = floatval($args['card_bg_opacity']);
            if ($opacity < 0.1 || $opacity > 1) {
                unset($args['card_bg_opacity']);
            } else {
                $args['card_bg_opacity'] = $opacity;
            }
        }

        // Actualizar solo los campos proporcionados
        $allowedFields = ['name', 'description', 'nationality', 'country', 'city', 'gender', 'birth_date', 'price_from', 'country_block', 'card_bg_color', 'card_bg_opacity'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $args)) {
                $updateData[$field] = $args[$field];
            }
        }

        $currentUser->update($updateData);

        return $currentUser->fresh(['tags', 'links', 'roles']);
    }
}
