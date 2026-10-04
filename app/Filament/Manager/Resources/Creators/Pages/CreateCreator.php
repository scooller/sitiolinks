<?php

namespace App\Filament\Manager\Resources\Creators\Pages;

use App\Filament\Manager\Resources\Creators\CreatorResource;
use App\Models\CreatorDocument;
use App\Models\ManagerCreator;
use App\Models\Notification;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateCreator extends CreateRecord
{
    protected static string $resource = CreatorResource::class;

    protected function beforeCreate(): void
    {
        $profile = auth()->user()?->managerProfile;
        if (! $profile || ! $profile->canAddCreator()) {
            $limit = SiteSettings::first()?->max_creators_per_manager ?? 20;
            FilamentNotification::make()
                ->title("Límite de {$limit} creadores alcanzado")
                ->danger()
                ->send();
            $this->halt();
        }
    }

    protected function handleRecordCreation(array $data): Model
    {
        $profile = auth()->user()?->managerProfile;
        abort_unless($profile && $profile->isActive(), 403, 'Perfil de manager no activo.');

        return DB::transaction(function () use ($data, $profile) {
            $token = Str::random(48);
            $password = Str::random(32);

            $creator = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'] ?? null,
                'password' => Hash::make($password),
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'],
                'birth_date' => $data['birth_date'],
                'privacy_consent' => true,
                'privacy_consent_at' => now(),
                'magic_link_token' => hash('sha256', $token),
                'magic_link_expires_at' => now()->addHours(72),
                'email_verified_at' => ! empty($data['email']) ? null : now(),
            ]);

            $creator->assignRole('user');

            $managerCreator = ManagerCreator::create([
                'manager_profile_id' => $profile->id,
                'creator_user_id' => $creator->id,
                'contact_email' => $data['contact_email'] ?? $data['email'],
                'status' => ManagerCreator::STATUS_PENDING,
            ]);

            CreatorDocument::create([
                'creator_user_id' => $creator->id,
                'manager_profile_id' => $profile->id,
                'type' => 'id_card',
            ]);

            // Notificar admins
            try {
                $admins = User::role(['admin', 'super_admin'])->get();
                foreach ($admins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'type' => Notification::TYPE_SYSTEM,
                        'title' => 'Nuevo creador pendiente de revisión',
                        'message' => "El manager @{$profile->user->username} ha registrado al creador @{$creator->username}.",
                        'data' => ['manager_creator_id' => $managerCreator->id, 'creator_id' => $creator->id],
                    ]);
                }
            } catch (\Throwable $e) {
                // Silencioso si falla la notificación
            }

            return $managerCreator;
        });
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
