<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;

class ExportMyDataQuery extends Query
{
    protected $attributes = [
        'name' => 'exportMyData',
        'description' => 'Exportar datos personales del usuario autenticado en formato JSON (Derecho de Portabilidad ARCOP - Ley N° 21.719)',
    ];

    public function type(): Type
    {
        return Type::string();
    }

    public function authorize($root, array $args, $ctx, $info = null, $fields = null): bool
    {
        return auth('web')->check();
    }

    public function resolve($root, array $args)
    {
        $user = auth('web')->user();

        if (! $user) {
            throw new \Exception('No autorizado para exportar datos.');
        }

        $user->load(['roles', 'tags', 'links', 'galleries.mediaItems']);

        $export = [
            'metadata' => [
                'platform' => 'Link Persons',
                'legal_framework' => 'Ley N° 21.719 / 19.628 de Protección de Datos Personales (Chile)',
                'export_date' => now()->toIso8601String(),
                'right_exercised' => 'Portabilidad de Datos (ARCOP)',
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'gender' => $user->gender,
                'birth_date' => $user->birth_date?->toDateString(),
                'nationality' => $user->nationality,
                'country' => $user->country,
                'city' => $user->city,
                'description' => $user->description,
                'price_from' => $user->price_from,
                'created_at' => $user->created_at?->toIso8601String(),
                'updated_at' => $user->updated_at?->toIso8601String(),
            ],
            'privacy_and_consent' => [
                'privacy_consent' => (bool) $user->privacy_consent,
                'privacy_consent_at' => $user->privacy_consent_at?->toIso8601String(),
                'privacy_policy_version' => $user->privacy_policy_version,
                'search_indexing_opt_in' => (bool) $user->search_indexing_opt_in,
                'email_notifications' => (bool) $user->email_notifications,
            ],
            'links' => $user->links->map(fn ($link) => [
                'id' => $link->id,
                'name' => $link->name,
                'url' => $link->url,
                'icon' => $link->icon,
                'is_adult' => (bool) $link->is_adult,
                'order' => $link->order,
            ])->all(),
            'tags' => $user->tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
            ])->all(),
            'galleries' => $user->galleries->map(fn ($gal) => [
                'id' => $gal->id,
                'title' => $gal->title,
                'visibility' => $gal->visibility,
                'status' => $gal->status,
                'media_count' => $gal->mediaItems->count(),
                'created_at' => $gal->created_at?->toIso8601String(),
            ])->all(),
        ];

        return json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
