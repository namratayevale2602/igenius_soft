<?php

namespace App\Filament\Resources\QuestionSetResource\Pages;

use App\Filament\Resources\QuestionSetResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewQuestionSet extends ViewRecord
{
    protected static string $resource = QuestionSetResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
            Actions\DeleteAction::make(),
        ];
    }
}