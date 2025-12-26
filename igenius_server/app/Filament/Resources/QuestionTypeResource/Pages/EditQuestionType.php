<?php

namespace App\Filament\Resources\QuestionTypeResource\Pages;

use App\Filament\Resources\QuestionTypeResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditQuestionType extends EditRecord
{
    protected static string $resource = QuestionTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
