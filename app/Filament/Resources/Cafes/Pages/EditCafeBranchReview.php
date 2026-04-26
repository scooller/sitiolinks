<?php

namespace App\Filament\Resources\Cafes\Pages;

use App\Filament\Resources\Cafes\CafeBranchReviewResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCafeBranchReview extends EditRecord
{
    protected static string $resource = CafeBranchReviewResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
