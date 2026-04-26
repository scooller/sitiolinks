<?php

namespace App\Filament\Resources\VipNotifications;

use App\Filament\Resources\VipNotifications\Pages\CreateVipNotification;
use App\Filament\Resources\VipNotifications\Pages\EditVipNotification;
use App\Filament\Resources\VipNotifications\Pages\ListVipNotifications;
use App\Filament\Resources\VipNotifications\Schemas\VipNotificationForm;
use App\Filament\Resources\VipNotifications\Tables\VipNotificationsTable;
use App\Models\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class VipNotificationResource extends Resource
{
    protected static ?string $model = Notification::class;

    protected static ?string $navigationLabel = 'Notificaciones VIP';

    protected static ?string $modelLabel = 'Notificacion VIP';

    protected static ?string $pluralModelLabel = 'Notificaciones VIP';

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Schema $schema): Schema
    {
        return VipNotificationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return VipNotificationsTable::configure($table);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('type', Notification::TYPE_VIP_USER_MESSAGE);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListVipNotifications::route('/'),
            'create' => CreateVipNotification::route('/create'),
            'edit' => EditVipNotification::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::query()
            ->where('type', Notification::TYPE_VIP_USER_MESSAGE)
            ->whereNull('read_at')
            ->count() ?: null;
    }
}
