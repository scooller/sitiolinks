<?php

namespace App\GraphQL\Mutations;

use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Log;
use Rebing\GraphQL\Support\Mutation;

class DismissWarningMutation extends Mutation
{
    protected $attributes = [
        'name' => 'dismissWarning',
        'description' => 'Marca el modal de advertencia como descartado para el usuario actual',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::boolean());
    }

    public function resolve($root, array $args, $context, \GraphQL\Type\Definition\ResolveInfo $info)
    {
        Log::info('DismissWarningMutation invoked');
        $user = auth('web')->user() ?? auth('sanctum')->user();
        Log::info('DismissWarningMutation auth', [
            'has_user' => (bool) $user,
            'user_id' => $user?->id,
        ]);

        if (! $user) {
            throw new UserError('Unauthenticated');
        }

        try {
            $user->warning_modal_dismissed = true;
            $user->save();
            Log::info('DismissWarningMutation saved', ['user_id' => $user->id]);
        } catch (\Throwable $e) {
            Log::error('DismissWarningMutation error', ['message' => $e->getMessage()]);
            throw new UserError('Could not dismiss warning');
        }

        return true;
    }
}
