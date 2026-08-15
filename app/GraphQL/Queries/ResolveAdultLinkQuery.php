<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Link;
use App\Support\Captcha;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;

class ResolveAdultLinkQuery extends Query
{
    protected $attributes = [
        'name' => 'resolveAdultLink',
        'description' => 'Devuelve la URL de un link +18 tras validar el captcha',
    ];

    public function type(): Type
    {
        return Type::string();
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'altchaToken' => [
                'type' => Type::nonNull(Type::string()),
            ],
        ];
    }

    public function resolve($root, array $args): ?string
    {
        if (! Captcha::verify($args['altchaToken'])) {
            throw new UserError('Captcha inválido');
        }

        return Link::findOrFail($args['id'])->url;
    }
}
