# Agent Instructions & Project Guidelines (Link Persons / only-models)

This document establishes the mandatory operational instructions, standards, and engineering workflows for all AI coding agents working within this repository.

---

## 1. Skill & Workflow Adoption (Mandatory)

Agents must **actively discover and leverage project skills and workflows** before and during the execution of any task:

1. **Skill Discovery & Execution**:
   - Inspect and utilize skills located in `.agents/skills/`, `.github/skills/`, and system-available skills.
   - When a task involves UI, motion, or styling, consult:
     - `apple-design`: Apple Human Interface Guidelines, Liquid Glass materials, optical icon alignment, touch targets (≥ 44pt), and natural motion curves.
     - `react-best-practices`: Performance, component structure, hook guidelines, and React 18 patterns.
     - `web-design-guidelines`: Accessibility (WCAG AA), contrast ratios, responsive layouts.
     - `tailwindcss-development`: Tailwind utility conventions and theme consistency.
     - `ponytail` (`DietrichGebert/ponytail`): Minimalist engineering and YAGNI principle. Enforce the simplest, shortest solution that works, avoiding speculative abstractions, bloat, and redundant dependencies. Use `ponytail-review` or `ponytail-audit` to detect over-engineering.
     - `caveman` & `caveman-commit`: Ultra-compressed communication, terse code comments, and concise conventional commits.
   - Use Graphify skill before starting work to understand the codebase.
   - Always read the relevant `SKILL.md` before starting work and apply its heuristics, techniques, and rules without taking shortcuts.
   - Update `front-site/public/llms.txt` and `front-site/public/llms-full.txt` to include all relevant information about the project, including the project name, description, and any other relevant information.
   - Run `Graphify` skill if needed after changes
   - Update `CHANGELOG.md` if needed after changes
   - Update `README.md` if needed after changes
   - Update `front-site/package.json` if needed after changes

2. **Project Workflows**:
   - Follow and respect continuous integration workflows in `.github/workflows/` (e.g. `react-best-practices-ci.yml`). Ensure changes satisfy linting, type-checking, and build validation.

---

## 2. Codebase Understanding & Architecture Queries: Use Graphify

For all architectural queries, file relationship exploration, dependency mapping, and codebase discovery:

- **Always query Graphify first**: The persistent knowledge graph located in `graphify-out/` represents the god nodes, module interactions, and architectural boundaries of this codebase.
- Consult graphify outputs and query tools to trace call graphs, data flow, and cross-cutting dependencies before modifying core modules.
- Do not make blind assumptions about imports, architectural coupling, or dependencies.

---

## 3. Frontend Architecture: Always Use Redux Toolkit (RTK)

For frontend state management, global store interactions, and API query/cache management in `front-site/`:

1. **Redux Toolkit (RTK) Standard**:
   - Always use **Redux Toolkit (`@reduxjs/toolkit`)** and **RTK Query** for managing application state and data fetching/caching.
   - Avoid fragmented custom fetch patterns or uncoordinated ad-hoc state solutions when handling shared or server state.
2. **RTK Conventions**:
   - Place slices, store configuration, and RTK Query API definitions in standard directories (`src/store/` or `src/features/`).
   - Export typed hooks (`useAppDispatch`, `useAppSelector`) to ensure strict TypeScript safety across components.
   - Leverage RTK Query tags for efficient cache invalidation on mutations (e.g., creating, updating, or deleting galleries, cafes, tickets, or user data).

---

## 4. Versioning, CHANGELOG, and README Maintenance

Whenever code changes, refactors, bugfixes, or new features are introduced, the agent must perform the following documentation and lifecycle updates:

1. **Version Bumping (SemVer)**:
   - Increment the project version in `front-site/package.json` (and root `package.json` if backend/root packages are touched) according to [Semantic Versioning (SemVer)](https://semver.org/):
     - **PATCH** (`0.2.x` → `0.2.x+1`): Bug fixes, style adjustments, minor refactors.
     - **MINOR** (`0.x.0` → `0.x+1.0`): New features, new components, non-breaking architectural additions.
     - **MAJOR** (`x.0.0` → `x+1.0.0`): Breaking changes or significant application overhauls.

2. **Update `CHANGELOG.md`**:
   - Maintain the project root `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) standard.
   - Record the new version header with date (e.g., `## [0.2.1] - YYYY-MM-DD`).
   - Group entries into clear categories:
     - `### Added` for new features or components.
     - `### Changed` for changes in existing functionality or design.
     - `### Fixed` for bug fixes.
     - `### Removed` for removed legacy elements.
     - `### Security` for accessibility or vulnerability improvements.

3. **Update `README.md`**:
   - If the changes affect setup instructions, environment variables, dependencies, admin configurations, or user-facing behavior, update the relevant `README.md` (root `README.md` and/or `front-site/README.md`).

---

## 5. Design & Engineering Standards

1. **Apple Human Interface Guidelines (HIG)**:
   - Maintain minimum touch target sizes of 44 × 44 pt.
   - Ensure WCAG AA contrast (≥ 4.5:1 for standard text, ≥ 3.0:1 for large text / graphical badges).
   - Use Apple Liquid Glass two-layer principles: translucent materials with backdrops (`blur(24px) saturate(140%)`) reserved for floating chrome (navbars, popovers, offcanvas), while content stays legible and crisp.
   - Adhere to Apple canonical motion curves (`appleEase = [0.16, 1, 0.3, 1]`) and fluid durations (0.16s - 0.28s).
   - Tab navigation bars should follow canonical icon-stacked-above-label layout with single-word concise labels.

2. **Build Verification**:
   - After applying changes, execute the relevant build and test commands (e.g., `npm run build` in `front-site/`, `php artisan test` or `composer run test` for backend changes) to verify zero build errors before reporting completion.

---

## 6. Mandatory Caveman Mode (ALWAYS Active)

Agents must **strictly adhere to the `caveman` and `caveman-commit` skills across all interactions and tasks at all times**:

1. **Chat Responses (`caveman`)**:
   - **Terse and Direct**: Eliminate filler words, pleasantries ("Sure!", "Certainly!"), hedging, decorative formatting, and tool-call narration.
   - **Dense Technical Substance**: Preserve full technical accuracy, commands, code blocks, and paths while cutting fluff.
   - **Preserve User Language**: If user writes in Spanish, answer in Spanish caveman; if English, answer in English caveman. Keep technical terms, file paths, and code exact.
   - **Pattern**: `[thing] [action] [reason]. [next step].`

2. **Code Comments**:
   - **Terse & Intent-Focused**: Document only non-obvious *why*, never *what* (the code itself states what).
   - **Zero Boilerplate**: No restating function names, param types, or trivial logic.
   - Use compact `ponytail:` annotations when leaving deliberate trade-offs.

3. **Git Commits (`caveman-commit`)**:
   - **Conventional Commits**: Format strictly as `<type>(<scope>): <imperative summary>`.
   - **Imperative & Concise**: Imperative mood ("add", "fix", "remove"), subject line ≤ 50 chars (hard limit 72), no trailing period.
   - **No Fluff**: Never write "This commit does...", no AI attribution, no emoji unless specified. Body included only for non-obvious *why* or breaking changes.

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.4
- filament/filament (FILAMENT) - v5
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- livewire/livewire (LIVEWIRE) - v4
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- phpunit/phpunit (PHPUNIT) - v11
- tailwindcss (TAILWINDCSS) - v4

## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double-check the available parameters.

## URLs
- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches when dealing with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The `search-docs` tool is perfect for all Laravel-related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless there is something very complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version-specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- In Laravel 12, middleware are no longer registered in `app/Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console\Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== livewire/core rules ===

## Livewire

- Use the `search-docs` tool to find exact version-specific documentation for how to write Livewire and Livewire tests.
- Use the `php artisan make:livewire [Posts\CreatePost]` Artisan command to create new components.
- State should live on the server, with the UI reflecting it.
- All Livewire requests hit the Laravel backend; they're like regular HTTP requests. Always validate form data and run authorization checks in Livewire actions.

## Livewire Best Practices
- Livewire components require a single root element.
- Use `wire:loading` and `wire:dirty` for delightful loading states.
- Add `wire:key` in loops:

    ```blade
    @foreach ($items as $item)
        <div wire:key="item-{{ $item->id }}">
            {{ $item->name }}
        </div>
    @endforeach
    ```

- Prefer lifecycle hooks like `mount()`, `updatedFoo()` for initialization and reactive side effects:

<code-snippet name="Lifecycle Hook Examples" lang="php">
    public function mount(User $user) { $this->user = $user; }
    public function updatedSearch() { $this->resetPage(); }
</code-snippet>


## Testing Livewire

<code-snippet name="Example Livewire Component Test" lang="php">
    Livewire::test(Counter::class)
        ->assertSet('count', 0)
        ->call('increment')
        ->assertSet('count', 1)
        ->assertSee(1)
        ->assertStatus(200);
</code-snippet>


<code-snippet name="Testing Livewire Component Exists on Page" lang="php">
    $this->get('/posts/create')
    ->assertSeeLivewire(CreatePost::class);
</code-snippet>

=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

## PHPUnit

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `php artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should test all of the happy paths, failure paths, and weird paths.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files; these are core to the application.

### Running Tests
- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `php artisan test --compact`.
- To run all tests in a file: `php artisan test --compact tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --compact --filter=testName` (recommended after making a change to a related file).

=== tailwindcss/core rules ===

## Tailwind CSS

- Use Tailwind CSS classes to style HTML; check and use existing Tailwind conventions within the project before writing your own.
- Offer to extract repeated patterns into components that match the project's conventions (i.e. Blade, JSX, Vue, etc.).
- Think through class placement, order, priority, and defaults. Remove redundant classes, add classes to parent or child carefully to limit repetition, and group elements logically.
- You can use the `search-docs` tool to get exact examples from the official documentation when needed.

### Spacing
- When listing items, use gap utilities for spacing; don't use margins.

<code-snippet name="Valid Flex Gap Spacing Example" lang="html">
    <div class="flex gap-8">
        <div>Superior</div>
        <div>Michigan</div>
        <div>Erie</div>
    </div>
</code-snippet>


### Dark Mode
- If existing pages and components support dark mode, new pages and components must support dark mode in a similar way, typically using `dark:`.

=== tailwindcss/v4 rules ===

## Tailwind CSS 4

- Always use Tailwind CSS v4; do not use the deprecated utilities.
- `corePlugins` is not supported in Tailwind v4.
- In Tailwind v4, configuration is CSS-first using the `@theme` directive — no separate `tailwind.config.js` file is needed.

<code-snippet name="Extending Theme in CSS" lang="css">
@theme {
  --color-brand: oklch(0.72 0.11 178);
}
</code-snippet>

- In Tailwind v4, you import Tailwind using a regular CSS `@import` statement, not using the `@tailwind` directives used in v3:

<code-snippet name="Tailwind v4 Import Tailwind Diff" lang="diff">
   - @tailwind base;
   - @tailwind components;
   - @tailwind utilities;
   + @import "tailwindcss";
</code-snippet>


### Replaced Utilities
- Tailwind v4 removed deprecated utilities. Do not use the deprecated option; use the replacement.
- Opacity values are still numeric.

| Deprecated |	Replacement |
|------------+--------------|
| bg-opacity-* | bg-black/* |
| text-opacity-* | text-black/* |
| border-opacity-* | border-black/* |
| divide-opacity-* | divide-black/* |
| ring-opacity-* | ring-black/* |
| placeholder-opacity-* | placeholder-black/* |
| flex-shrink-* | shrink-* |
| flex-grow-* | grow-* |
| overflow-ellipsis | text-ellipsis |
| decoration-slice | box-decoration-slice |
| decoration-clone | box-decoration-clone |

=== spatie/laravel-medialibrary rules ===

## Media Library

- `spatie/laravel-medialibrary` associates files with Eloquent models, with support for collections, conversions, and responsive images.
- Always activate the `medialibrary-development` skill when working with media uploads, conversions, collections, responsive images, or any code that uses the `HasMedia` interface or `InteractsWithMedia` trait.
</laravel-boost-guidelines>
