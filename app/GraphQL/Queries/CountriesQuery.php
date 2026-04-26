<?php

namespace App\GraphQL\Queries;

use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\File;
use Monarobase\CountryList\CountryListFacade as Countries;
use Rebing\GraphQL\Support\Query;

class CountriesQuery extends Query
{
    protected $attributes = [
        'name' => 'countries',
        'description' => 'Lista de países y ciudades',
    ];

    public function type(): Type
    {
        return Type::nonNull(Type::string());
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $countries = Countries::getList('es', 'php') ?? [];

        // Cargar ciudades
        $citiesPath = base_path('resources/data/cities_by_country_es.json');
        $cities = [];
        if (File::exists($citiesPath)) {
            $cities = json_decode(File::get($citiesPath), true) ?: [];
        }

        return json_encode([
            'countries' => $countries,
            'cities' => $cities,
        ]);
    }
}
