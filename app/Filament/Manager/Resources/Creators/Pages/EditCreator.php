<?php

namespace App\Filament\Manager\Resources\Creators\Pages;

use App\Filament\Manager\Resources\Creators\CreatorResource;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

class EditCreator extends EditRecord
{
    protected static string $resource = CreatorResource::class;

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $creator = $this->record->creator;
        if ($creator) {
            $data['name'] = $creator->name;
            $data['username'] = $creator->username;
            $data['email'] = $creator->email;
            $data['phone'] = $creator->phone;
            $data['gender'] = $creator->gender;
            $data['birth_date'] = $creator->birth_date;
        }

        return $data;
    }

    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        $creator = $record->creator;
        if ($creator) {
            $creator->update([
                'name' => $data['name'] ?? $creator->name,
                'email' => $data['email'] ?? $creator->email,
                'phone' => $data['phone'] ?? $creator->phone,
                'gender' => $data['gender'] ?? $creator->gender,
                'birth_date' => $data['birth_date'] ?? $creator->birth_date,
            ]);
        }

        if (isset($data['contact_email'])) {
            $record->update(['contact_email' => $data['contact_email']]);
        }

        return $record;
    }

    protected function getHeaderActions(): array
    {
        return [];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
