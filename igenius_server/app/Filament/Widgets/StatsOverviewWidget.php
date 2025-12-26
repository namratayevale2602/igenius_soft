<?php

namespace App\Filament\Widgets;

use App\Models\Level;
use App\Models\Question;
use App\Models\QuestionSet;
use App\Models\Week;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Levels', Level::count())
                ->description('Active learning levels')
                ->descriptionIcon('heroicon-o-rectangle-stack')
                ->color('primary'),
            
            Stat::make('Total Weeks', Week::count())
                ->description('Practice weeks available')
                ->descriptionIcon('heroicon-o-calendar')
                ->color('success'),
            
            Stat::make('Question Sets', QuestionSet::count())
                ->description('Available practice sets')
                ->descriptionIcon('heroicon-o-document-text')
                ->color('warning'),
            
            Stat::make('Total Questions', Question::count())
                ->description('Individual practice questions')
                ->descriptionIcon('heroicon-o-question-mark-circle')
                ->color('danger'),
        ];
    }
}