<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Language\AST\StringValueNode;
use GraphQL\Type\Definition\ScalarType;

class DateTimeType extends ScalarType
{
    public $name = 'DateTime';

    public $description = 'DateTime type for timestamps';

    /**
     * Serialize a DateTime value to a string for output
     */
    public function serialize($value): string
    {
        if ($value instanceof \DateTime || $value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        return (string) $value;
    }

    /**
     * Parse value from client input
     */
    public function parseValue($value): string
    {
        return (string) $value;
    }

    /**
     * Parse literal value from AST
     */
    public function parseLiteral($valueNode, ?array $variables = null): ?string
    {
        if ($valueNode instanceof StringValueNode) {
            return $valueNode->value;
        }

        return null;
    }
}
