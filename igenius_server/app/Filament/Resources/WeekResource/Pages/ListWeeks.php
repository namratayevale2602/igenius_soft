<?php

namespace App\Filament\Resources\WeekResource\Pages;

use App\Filament\Resources\WeekResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListWeeks extends ListRecords
{
    protected static string $resource = WeekResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
