<?php

namespace App\Filament\Resources\EmailLogs;

use App\Filament\Resources\EmailLogs\Pages\ListEmailLogs;
use App\Filament\Resources\EmailLogs\Tables\EmailLogsTable;
use App\Models\EmailLog;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class EmailLogResource extends Resource
{
    protected static ?string $model = EmailLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedInboxStack;

    protected static string|\UnitEnum|null $navigationGroup = 'Emails & Envíos';

    protected static ?string $navigationLabel = 'Historial de Emails';

    protected static ?string $modelLabel = 'Registro de Email';

    protected static ?string $pluralModelLabel = 'Historial de Emails';

    protected static ?int $navigationSort = 3;

    public static function table(Table $table): Table
    {
        return EmailLogsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListEmailLogs::route('/'),
        ];
    }
}
