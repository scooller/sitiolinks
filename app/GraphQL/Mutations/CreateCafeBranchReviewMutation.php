<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\CafeBranch;
use App\Models\CafeBranchReview;
use GraphQL\Error\UserError;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;

class CreateCafeBranchReviewMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createCafeBranchReview',
        'description' => 'Crea una reseña para una sucursal de cafe',
    ];

    public function type(): Type
    {
        return GraphQL::type('CafeBranchReview');
    }

    public function args(): array
    {
        return [
            'branch_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID de la sucursal',
            ],
            'rating' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'Calificacion de 1 a 5',
            ],
            'comment' => [
                'type' => Type::string(),
                'description' => 'Comentario de la reseña',
            ],
        ];
    }

    public function resolve($root, array $args): CafeBranchReview
    {
        $user = Auth::user();

        if (! $user) {
            throw new UserError('No autenticado');
        }

        $branch = CafeBranch::query()->find((int) $args['branch_id']);

        if (! $branch) {
            throw new UserError('Sucursal no encontrada');
        }

        $rating = (int) $args['rating'];
        if ($rating < 1 || $rating > 5) {
            throw new UserError('La calificacion debe estar entre 1 y 5');
        }

        $comment = trim((string) ($args['comment'] ?? ''));
        if (mb_strlen($comment) > 1000) {
            throw new UserError('El comentario no puede superar 1000 caracteres');
        }

        $review = CafeBranchReview::query()->create([
            'cafe_branch_id' => $branch->id,
            'user_id' => $user->id,
            'rating' => $rating,
            'comment' => $comment !== '' ? $comment : null,
        ]);

        return $review->fresh(['user.roles']);
    }
}
