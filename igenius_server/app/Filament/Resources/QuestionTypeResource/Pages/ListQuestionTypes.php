<?php

namespace App\Filament\Resources\QuestionTypeResource\Pages;

use App\Filament\Resources\QuestionTypeResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListQuestionTypes extends ListRecords
{
    protected static string $resource = QuestionTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
