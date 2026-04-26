<?php

declare(strict_types=1);

namespace App\Support;

use GraphQL\Error\Error;

class GraphQLErrorsHandler
{
    /**
     * @param  Error[]  $errors
     * @return Error[]
     */
    public static function handle(array $errors, callable $formatter): array
    {
        return array_map($formatter, $errors);
    }
}
