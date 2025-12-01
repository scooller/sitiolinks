<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\Cache;

class GraphQLCache
{
    /**
     * Cachea el resultado de un bloque si se considera cacheable.
     * Genera una clave compacta basada en los fragmentos proporcionados.
     * Lleva registro de claves por tipo de query para invalidación selectiva.
     */
    public static function remember(array $parts, int $ttl, Closure $callback)
    {
        $queryName = $parts['query'] ?? 'generic';
        // Normalizar y limpiar valores null vacíos para una clave estable
        $normalized = [];
        foreach ($parts as $k => $v) {
            if ($v === null || $v === '') {
                continue;
            }
            $normalized[$k] = $v;
        }
        ksort($normalized);
        $rawKey = 'gql_'.md5(json_encode($normalized));

        $value = Cache::remember($rawKey, $ttl, $callback);

        // Registrar clave
        $listKey = 'gql_keys_'.$queryName;
        $existing = Cache::get($listKey, []);
        if (! in_array($rawKey, $existing, true)) {
            $existing[] = $rawKey;
            Cache::put($listKey, $existing, $ttl * 10); // lista persiste más tiempo
        }

        return $value;
    }

    /**
     * Invalidar todas las claves asociadas a un nombre de query.
     */
    public static function flushFor(string $queryName): void
    {
        $listKey = 'gql_keys_'.$queryName;
        $keys = Cache::get($listKey, []);
        foreach ($keys as $k) {
            Cache::forget($k);
        }
        Cache::forget($listKey);
    }
}
