<?php

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;
use Spatie\Permission\Models\Role as RoleModel;

class RoleType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Role',
        'description' => 'Rol de usuario',
        'model' => RoleModel::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::string(),
                'description' => 'Nombre del rol',
            ],
            'guard_name' => [
                'type' => Type::string(),
                'description' => 'Guard del rol',
            ],
        ];
    }
}
