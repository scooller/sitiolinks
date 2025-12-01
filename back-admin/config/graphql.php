<?php

declare(strict_types=1);

return [
    'route' => [
        // The prefix for routes; do NOT use a leading slash!
        'prefix' => 'graphql',

        // The controller/method to use in GraphQL request.
        // Also supported array syntax: `[\Rebing\GraphQL\GraphQLController::class, 'query']`
        'controller' => Rebing\GraphQL\GraphQLController::class.'@query',

        // Any middleware for the graphql route group
        // This middleware will apply to all schemas
        // Use stateful SPA auth: rely on 'web' group (includes session middleware)
        'middleware' => [
            'web',
        ],

        // Additional route group attributes
        //
        // Example:
        //
        // 'group_attributes' => ['guard' => 'api']
        //
        'group_attributes' => [],
    ],

    // The name of the default schema
    // Used when the route group is directly accessed
    'default_schema' => 'default',

    'batching' => [
        // Whether to support GraphQL batching or not.
        // See e.g. https://www.apollographql.com/blog/batching-client-graphql-queries-a685f5bcd41b/
        // for pro and con
        'enable' => true,
    ],

    // The schemas for query and/or mutation. It expects an array of schemas to provide
    // both the 'query' fields and the 'mutation' fields.
    //
    // You can also provide a middleware that will only apply to the given schema
    //
    // Example:
    //
    //  'schemas' => [
    //      'default' => [
    //          'controller' => MyController::class . '@method',
    //          'query' => [
    //              App\GraphQL\Queries\UsersQuery::class,
    //          ],
    //          'mutation' => [
    //
    //          ]
    //      ],
    //      'user' => [
    //          'query' => [
    //              App\GraphQL\Queries\ProfileQuery::class,
    //          ],
    //          'mutation' => [
    //
    //          ],
    //          'middleware' => ['auth'],
    //      ],
    //      'user/me' => [
    //          'query' => [
    //              App\GraphQL\Queries\MyProfileQuery::class,
    //          ],
    //          'mutation' => [
    //
    //          ],
    //          'middleware' => ['auth'],
    //      ],
    //  ]
    //
    'schemas' => [
        'default' => [
            'query' => [
                App\GraphQL\Queries\UsersQuery::class,
                App\GraphQL\Queries\UserQuery::class,
                App\GraphQL\Queries\TagsQuery::class,
                App\GraphQL\Queries\SiteSettingsQuery::class,
                App\GraphQL\Queries\FollowersQuery::class,
                App\GraphQL\Queries\FollowingQuery::class,
                App\GraphQL\Queries\GalleriesQuery::class,
                App\GraphQL\Queries\GalleryQuery::class,
                App\GraphQL\Queries\NotificationsQuery::class,
                App\GraphQL\Queries\UnreadNotificationsCountQuery::class,
                App\GraphQL\Queries\SystemStatsQuery::class, // v2.7.23 Analytics
            ],
            'mutation' => [
                App\GraphQL\Mutations\CreateLinkMutation::class,
                App\GraphQL\Mutations\UpdateLinkMutation::class,
                App\GraphQL\Mutations\DeleteLinkMutation::class,
                App\GraphQL\Mutations\ReorderLinksMutation::class,
                App\GraphQL\Mutations\AssignUserTagsMutation::class,
                App\GraphQL\Mutations\FollowUserMutation::class,
                App\GraphQL\Mutations\UnfollowUserMutation::class,
                App\GraphQL\Mutations\AddTicketCommentMutation::class,
                App\GraphQL\Mutations\UpdateTicketMutation::class,
                App\GraphQL\Mutations\CreateGalleryMutation::class,
                App\GraphQL\Mutations\UpdateGalleryMutation::class,
                App\GraphQL\Mutations\DeleteGalleryMutation::class,
                App\GraphQL\Mutations\UpdateGalleryAllowedUsersMutation::class,
                App\GraphQL\Mutations\AddMediaToGalleryMutation::class,
                App\GraphQL\Mutations\RemoveMediaFromGalleryMutation::class,
                App\GraphQL\Mutations\ReorderGalleryMediaMutation::class,
                App\GraphQL\Mutations\UpdateProfileMutation::class,
                App\GraphQL\Mutations\UpdateLinksMutation::class,
                App\GraphQL\Mutations\UpdateAvatarMutation::class,
                App\GraphQL\Mutations\ModerateGalleryMutation::class,
                App\GraphQL\Mutations\ToggleFeaturedGalleryMutation::class,
                App\GraphQL\Mutations\ToggleLikeMutation::class,
                App\GraphQL\Mutations\ToggleUserLikeMutation::class,
                App\GraphQL\Mutations\MarkNotificationAsReadMutation::class,
                App\GraphQL\Mutations\MarkAllNotificationsAsReadMutation::class,
                App\GraphQL\Mutations\DismissWarningMutation::class,
            ],
            // The types only available in this schema
            'types' => [
                App\GraphQL\Types\UserType::class,
                App\GraphQL\Types\TagType::class,
                App\GraphQL\Types\LinkType::class,
                App\GraphQL\Types\LikeType::class,
                App\GraphQL\Types\UserLikeType::class,
                App\GraphQL\Types\LinkInputType::class,
                App\GraphQL\Types\RoleType::class,
                App\GraphQL\Types\SiteSettingsType::class,
                App\GraphQL\Types\TicketType::class,
                App\GraphQL\Types\TicketCommentType::class,
                App\GraphQL\Types\GalleryType::class,
                App\GraphQL\Types\GalleryMediaItemType::class,
                App\GraphQL\Types\NotificationType::class,
                App\GraphQL\Types\PaginatorInfoType::class,
                App\GraphQL\Types\GalleryPaginatorType::class,
                App\GraphQL\Types\UserPaginatorType::class,
                App\GraphQL\Types\SystemStatsType::class, // v2.7.23 Analytics
            ],

            // Laravel HTTP middleware (schema-specific). Protected by session (`auth:web`).
            'middleware' => ['auth:web'],

            // Which HTTP methods to support; must be given in UPPERCASE!
            'method' => ['GET', 'POST'],

            // An array of middlewares, overrides the global ones
            'execution_middleware' => null,

            // Route attributes applied when generating the HTTP route for this schema
            // Example:
            // 'route_attributes' => [
            //     'domain' => 'api.example.com',
            // ]
            'route_attributes' => [],
        ],
        'public' => [
            'query' => [
                App\GraphQL\Queries\UsersQuery::class,
                App\GraphQL\Queries\UserQuery::class,
                App\GraphQL\Queries\TopViewedUsersQuery::class,
                App\GraphQL\Queries\TagsQuery::class,
                App\GraphQL\Queries\SiteSettingsQuery::class,
                App\GraphQL\Queries\FollowersQuery::class,
                App\GraphQL\Queries\FollowingQuery::class,
                App\GraphQL\Queries\PagesQuery::class,
                App\GraphQL\Queries\PageQuery::class,
                App\GraphQL\Queries\TicketsQuery::class,
                App\GraphQL\Queries\TicketQuery::class,
                App\GraphQL\Queries\GalleriesQuery::class,
                App\GraphQL\Queries\GalleryQuery::class,
                App\GraphQL\Queries\FeaturedGalleriesQuery::class,
                App\GraphQL\Queries\CountriesQuery::class,
            ],
            'mutation' => [
                App\GraphQL\Mutations\CreateContactMessageMutation::class,
                App\GraphQL\Mutations\CreateTicketMutation::class,
            ],
            'types' => [
                App\GraphQL\Types\UserType::class,
                App\GraphQL\Types\TagType::class,
                App\GraphQL\Types\LinkType::class,
                App\GraphQL\Types\RoleType::class,
                App\GraphQL\Types\SiteSettingsType::class,
                App\GraphQL\Types\ContactMessageType::class,
                App\GraphQL\Types\PageType::class,
                App\GraphQL\Types\TicketType::class,
                App\GraphQL\Types\TicketCommentType::class,
                App\GraphQL\Types\GalleryType::class,
                App\GraphQL\Types\GalleryMediaItemType::class,
                App\GraphQL\Types\PaginatorInfoType::class,
                App\GraphQL\Types\GalleryPaginatorType::class,
                App\GraphQL\Types\UserPaginatorType::class,
            ],
            // Public schema remains open (rate limited only)
            'middleware' => ['throttle:60,1'],
            'method' => ['GET', 'POST'],
            'execution_middleware' => null,
            'route_attributes' => [],
        ],
    ],

    // The global types available to all schemas.
    // You can then access it from the facade like this: GraphQL::type('user')
    //
    // Example:
    //
    // 'types' => [
    //     App\GraphQL\Types\UserType::class
    // ]
    //
    'types' => [
        App\GraphQL\Types\PaginatorInfoType::class,
        App\GraphQL\Types\GalleryPaginatorType::class,
        App\GraphQL\Types\UserPaginatorType::class,
    ],

    // This callable will be passed the Error object for each errors GraphQL catch.
    // The method should return an array representing the error.
    // Typically:
    // [
    //     'message' => '',
    //     'locations' => []
    // ]
    'error_formatter' => [Rebing\GraphQL\GraphQL::class, 'formatError'],

    /*
     * Custom Error Handling
     *
     * Expected handler signature is: function (array $errors, callable $formatter): array
     *
     * The default handler will pass exceptions to laravel Error Handling mechanism
     */
    'errors_handler' => [Rebing\GraphQL\GraphQL::class, 'handleErrors'],

    /*
     * Options to limit the query complexity and depth. See the doc
     * @ https://webonyx.github.io/graphql-php/security
     * for details. Disabled by default.
     */
    'security' => [
        'query_max_complexity' => null,
        'query_max_depth' => null,
        'disable_introspection' => false,
    ],

    /*
     * You can define your own pagination type.
     * Reference \Rebing\GraphQL\Support\PaginationType::class
     */
    'pagination_type' => Rebing\GraphQL\Support\PaginationType::class,

    /*
     * You can define your own simple pagination type.
     * Reference \Rebing\GraphQL\Support\SimplePaginationType::class
     */
    'simple_pagination_type' => Rebing\GraphQL\Support\SimplePaginationType::class,

    /*
     * You can define your own cursor pagination type.
     * Reference Rebing\GraphQL\Support\CursorPaginationType::class
     */
    'cursor_pagination_type' => Rebing\GraphQL\Support\CursorPaginationType::class,

    /*
     * Overrides the default field resolver
     * See http://webonyx.github.io/graphql-php/data-fetching/#default-field-resolver
     *
     * Example:
     *
     * ```php
     * 'defaultFieldResolver' => function ($root, $args, $context, $info) {
     * },
     * ```
     * or
     * ```php
     * 'defaultFieldResolver' => [SomeKlass::class, 'someMethod'],
     * ```
     */
    'defaultFieldResolver' => null,

    /*
     * Any headers that will be added to the response returned by the default controller
     */
    'headers' => [],

    /*
     * Any JSON encoding options when returning a response from the default controller
     * See http://php.net/manual/function.json-encode.php for the full list of options
     */
    'json_encoding_options' => 0,

    /*
     * Automatic Persisted Queries (APQ)
     * See https://www.apollographql.com/docs/apollo-server/performance/apq/
     *
     * Note 1: this requires the `AutomaticPersistedQueriesMiddleware` being enabled
     *
     * Note 2: even if APQ is disabled per configuration and, according to the "APQ specs" (see above),
     *         to return a correct response in case it's not enabled, the middleware needs to be active.
     *         Of course if you know you do not have a need for APQ, feel free to remove the middleware completely.
     */
    'apq' => [
        // Enable/Disable APQ - See https://www.apollographql.com/docs/apollo-server/performance/apq/#disabling-apq
        'enable' => env('GRAPHQL_APQ_ENABLE', false),

        // The cache driver used for APQ
        'cache_driver' => env('GRAPHQL_APQ_CACHE_DRIVER', config('cache.default')),

        // The cache prefix
        'cache_prefix' => config('cache.prefix').':graphql.apq',

        // The cache ttl in seconds - See https://www.apollographql.com/docs/apollo-server/performance/apq/#adjusting-cache-time-to-live-ttl
        'cache_ttl' => 300,
    ],

    /*
     * Execution middlewares
     */
    'execution_middleware' => [
        Rebing\GraphQL\Support\ExecutionMiddleware\ValidateOperationParamsMiddleware::class,
        // AutomaticPersistedQueriesMiddleware listed even if APQ is disabled, see the docs for the `'apq'` configuration
        Rebing\GraphQL\Support\ExecutionMiddleware\AutomaticPersistedQueriesMiddleware::class,
        Rebing\GraphQL\Support\ExecutionMiddleware\AddAuthUserContextValueMiddleware::class,
        // \Rebing\GraphQL\Support\ExecutionMiddleware\UnusedVariablesMiddleware::class,
    ],

    /*
     * Globally registered ResolverMiddleware
     */
    'resolver_middleware_append' => null,
];
