<?php

namespace App\Filament\Resources\Cafes\Pages;

use App\Filament\Resources\Cafes\CafeBranchReviewResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCafeBranchReviews extends ListRecords
{
    protected static string $resource = CafeBranchReviewResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
