<?php

declare(strict_types=1);
use App\GraphQL\Mutations\AddMediaToGalleryMutation;
use App\GraphQL\Mutations\AddTicketCommentMutation;
use App\GraphQL\Mutations\AssignUserTagsMutation;
use App\GraphQL\Mutations\CreateContactMessageMutation;
use App\GraphQL\Mutations\CreateGalleryMutation;
use App\GraphQL\Mutations\CreateLinkMutation;
use App\GraphQL\Mutations\CreateTicketMutation;
use App\GraphQL\Mutations\DeleteGalleryMutation;
use App\GraphQL\Mutations\DeleteLinkMutation;
use App\GraphQL\Mutations\DismissWarningMutation;
use App\GraphQL\Mutations\FollowUserMutation;
use App\GraphQL\Mutations\MarkAllNotificationsAsReadMutation;
use App\GraphQL\Mutations\MarkNotificationAsReadMutation;
use App\GraphQL\Mutations\ModerateGalleryMutation;
use App\GraphQL\Mutations\RemoveMediaFromGalleryMutation;
use App\GraphQL\Mutations\ReorderGalleryMediaMutation;
use App\GraphQL\Mutations\ReorderLinksMutation;
use App\GraphQL\Mutations\SendVipNotificationMutation;
use App\GraphQL\Mutations\ToggleFeaturedGalleryMutation;
use App\GraphQL\Mutations\ToggleLikeMutation;
use App\GraphQL\Mutations\ToggleUserLikeMutation;
use App\GraphQL\Mutations\UnfollowUserMutation;
use App\GraphQL\Mutations\UpdateAvatarMutation;
use App\GraphQL\Mutations\UpdateGalleryAllowedUsersMutation;
use App\GraphQL\Mutations\UpdateGalleryMutation;
use App\GraphQL\Mutations\UpdateLinkMutation;
use App\GraphQL\Mutations\UpdateLinksMutation;
use App\GraphQL\Mutations\UpdateProfileMutation;
use App\GraphQL\Mutations\UpdateTicketMutation;
use App\GraphQL\Queries\CountriesQuery;
use App\GraphQL\Queries\FeaturedGalleriesQuery;
use App\GraphQL\Queries\FollowersQuery;
use App\GraphQL\Queries\FollowingQuery;
use App\GraphQL\Queries\GalleriesQuery;
use App\GraphQL\Queries\GalleryQuery;
use App\GraphQL\Queries\NotificationsQuery;
use App\GraphQL\Queries\PageQuery;
use App\GraphQL\Queries\PagesQuery;
use App\GraphQL\Queries\SiteSettingsQuery;
use App\GraphQL\Queries\SystemStatsQuery;
use App\GraphQL\Queries\TagsQuery;
use App\GraphQL\Queries\TicketQuery;
use App\GraphQL\Queries\TicketsQuery;
use App\GraphQL\Queries\TopViewedUsersQuery;
use App\GraphQL\Queries\UnreadNotificationsCountQuery;
use App\GraphQL\Queries\UserQuery;
use App\GraphQL\Queries\UsersQuery;
use App\GraphQL\Queries\VipNotificationsQuery;
use App\GraphQL\Queries\VipUnreadNotificationsCountQuery;
use App\GraphQL\Types\ContactMessageType;
use App\GraphQL\Types\GalleryMediaItemType;
use App\GraphQL\Types\GalleryPaginatorType;
use App\GraphQL\Types\GalleryType;
use App\GraphQL\Types\LikeType;
use App\GraphQL\Types\LinkInputType;
use App\GraphQL\Types\LinkType;
use App\GraphQL\Types\NotificationType;
use App\GraphQL\Types\PageType;
use App\GraphQL\Types\PaginatorInfoType;
use App\GraphQL\Types\RoleType;
use App\GraphQL\Types\SiteSettingsType;
use App\GraphQL\Types\SystemStatsType;
use App\GraphQL\Types\TagType;
use App\GraphQL\Types\TicketCommentType;
use App\GraphQL\Types\TicketType;
use App\GraphQL\Types\UserLikeType;
use App\GraphQL\Types\UserPaginatorType;
use App\GraphQL\Types\UserType;
use Rebing\GraphQL\GraphQL;
use Rebing\GraphQL\GraphQLController;
use Rebing\GraphQL\Support\CursorPaginationType;
use Rebing\GraphQL\Support\ExecutionMiddleware\AddAuthUserContextValueMiddleware;
use Rebing\GraphQL\Support\ExecutionMiddleware\AutomaticPersistedQueriesMiddleware;
use Rebing\GraphQL\Support\ExecutionMiddleware\ValidateOperationParamsMiddleware;
use Rebing\GraphQL\Support\PaginationType;
use Rebing\GraphQL\Support\SimplePaginationType;

return [
    'route' => [
        // The prefix for routes; do NOT use a leading slash!
        'prefix' => 'graphql',

        // The controller/method to use in GraphQL request.
        // Also supported array syntax: `[\Rebing\GraphQL\GraphQLController::class, 'query']`
        'controller' => GraphQLController::class.'@query',

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
                UsersQuery::class,
                UserQuery::class,
                TagsQuery::class,
                SiteSettingsQuery::class,
                FollowersQuery::class,
                FollowingQuery::class,
                GalleriesQuery::class,
                GalleryQuery::class,
                NotificationsQuery::class,
                UnreadNotificationsCountQuery::class,
                VipNotificationsQuery::class,
                VipUnreadNotificationsCountQuery::class,
                SystemStatsQuery::class, // v2.7.23 Analytics
            ],
            'mutation' => [
                CreateLinkMutation::class,
                UpdateLinkMutation::class,
                DeleteLinkMutation::class,
                ReorderLinksMutation::class,
                AssignUserTagsMutation::class,
                FollowUserMutation::class,
                UnfollowUserMutation::class,
                AddTicketCommentMutation::class,
                UpdateTicketMutation::class,
                CreateGalleryMutation::class,
                UpdateGalleryMutation::class,
                DeleteGalleryMutation::class,
                UpdateGalleryAllowedUsersMutation::class,
                AddMediaToGalleryMutation::class,
                RemoveMediaFromGalleryMutation::class,
                ReorderGalleryMediaMutation::class,
                UpdateProfileMutation::class,
                UpdateLinksMutation::class,
                UpdateAvatarMutation::class,
                ModerateGalleryMutation::class,
                ToggleFeaturedGalleryMutation::class,
                ToggleLikeMutation::class,
                ToggleUserLikeMutation::class,
                MarkNotificationAsReadMutation::class,
                MarkAllNotificationsAsReadMutation::class,
                SendVipNotificationMutation::class,
                DismissWarningMutation::class,
            ],
            // The types only available in this schema
            'types' => [
                UserType::class,
                TagType::class,
                LinkType::class,
                LikeType::class,
                UserLikeType::class,
                LinkInputType::class,
                RoleType::class,
                SiteSettingsType::class,
                TicketType::class,
                TicketCommentType::class,
                GalleryType::class,
                GalleryMediaItemType::class,
                NotificationType::class,
                PaginatorInfoType::class,
                GalleryPaginatorType::class,
                UserPaginatorType::class,
                SystemStatsType::class, // v2.7.23 Analytics
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
                UsersQuery::class,
                UserQuery::class,
                TopViewedUsersQuery::class,
                TagsQuery::class,
                SiteSettingsQuery::class,
                FollowersQuery::class,
                FollowingQuery::class,
                PagesQuery::class,
                PageQuery::class,
                TicketsQuery::class,
                TicketQuery::class,
                GalleriesQuery::class,
                GalleryQuery::class,
                FeaturedGalleriesQuery::class,
                CountriesQuery::class,
            ],
            'mutation' => [
                CreateContactMessageMutation::class,
                CreateTicketMutation::class,
            ],
            'types' => [
                UserType::class,
                TagType::class,
                LinkType::class,
                RoleType::class,
                SiteSettingsType::class,
                ContactMessageType::class,
                PageType::class,
                TicketType::class,
                TicketCommentType::class,
                GalleryType::class,
                GalleryMediaItemType::class,
                PaginatorInfoType::class,
                GalleryPaginatorType::class,
                UserPaginatorType::class,
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
        PaginatorInfoType::class,
        GalleryPaginatorType::class,
        UserPaginatorType::class,
    ],

    // This callable will be passed the Error object for each errors GraphQL catch.
    // The method should return an array representing the error.
    // Typically:
    // [
    //     'message' => '',
    //     'locations' => []
    // ]
    'error_formatter' => [GraphQL::class, 'formatError'],

    /*
     * Custom Error Handling
     *
     * Expected handler signature is: function (array $errors, callable $formatter): array
     *
     * The default handler will pass exceptions to laravel Error Handling mechanism
     */
    'errors_handler' => [GraphQL::class, 'handleErrors'],

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
    'pagination_type' => PaginationType::class,

    /*
     * You can define your own simple pagination type.
     * Reference \Rebing\GraphQL\Support\SimplePaginationType::class
     */
    'simple_pagination_type' => SimplePaginationType::class,

    /*
     * You can define your own cursor pagination type.
     * Reference Rebing\GraphQL\Support\CursorPaginationType::class
     */
    'cursor_pagination_type' => CursorPaginationType::class,

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
        ValidateOperationParamsMiddleware::class,
        // AutomaticPersistedQueriesMiddleware listed even if APQ is disabled, see the docs for the `'apq'` configuration
        AutomaticPersistedQueriesMiddleware::class,
        AddAuthUserContextValueMiddleware::class,
        // \Rebing\GraphQL\Support\ExecutionMiddleware\UnusedVariablesMiddleware::class,
    ],

    /*
     * Globally registered ResolverMiddleware
     */
    'resolver_middleware_append' => null,
];
