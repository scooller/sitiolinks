<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class Documentation extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static string|\UnitEnum|null $navigationGroup = 'Ayuda';

    protected string $view = 'filament.pages.documentation';

    public ?string $html = null;

    public ?string $sourcePath = null;

    public function mount(): void
    {
        $repoRoot = dirname(base_path());
        $candidates = [
            $repoRoot.DIRECTORY_SEPARATOR.'README.md',        // README en la raíz del monorepo
            base_path('README.md'),                               // README del proyecto Laravel (fallback)
            base_path('back-admin/README.md'),                    // Fallback explícito
        ];

        foreach ($candidates as $path) {
            if (File::exists($path)) {
                $this->sourcePath = $path;
                break;
            }
        }

        $markdown = '# README no encontrado';
        if ($this->sourcePath) {
            $markdown = File::get($this->sourcePath) ?: $markdown;
        }

        // Usa el parser de Laravel para Markdown si está disponible; fallback simple
        $this->html = method_exists(Str::class, 'markdown')
            ? Str::markdown($markdown)
            : nl2br(e($markdown));
    }

    public function getTitle(): string
    {
        return 'Documentación';
    }

    public static function getNavigationLabel(): string
    {
        return 'Documentación';
    }

    public static function canAccess(): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        // Permiso de Filament Shield si existe
        $gate = Gate::forUser($user);
        $permissionCandidates = [
            'view_Documentation',        // Shield common naming for pages
            'View:Documentation',        // Display-style naming
            'page_Documentation',        // Legacy/custom naming used antes
        ];
        foreach ($permissionCandidates as $ability) {
            if ($gate->check($ability)) {
                return true;
            }
        }

        // Fallback: restringir a roles de administración
        return DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', get_class($user))
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['super_admin', 'admin'])
            ->exists();
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }
}
