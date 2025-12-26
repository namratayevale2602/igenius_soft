<?php

namespace App\Filament\Resources\WeekResource\RelationManagers;

use App\Models\QuestionType;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class QuestionSetsRelationManager extends RelationManager
{
    protected static string $relationship = 'questionSets';

    protected static ?string $recordTitleAttribute = 'name';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('question_type_id')
                    ->label('Question Type')
                    ->options(QuestionType::all()->pluck('name', 'id'))
                    ->searchable()
                    ->required(),
                
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                
                Forms\Components\TextInput::make('set_number')
                    ->numeric()
                    ->required()
                    ->minValue(1),
                
                Forms\Components\TextInput::make('total_questions')
                    ->numeric()
                    ->default(0)
                    ->minValue(0),
                
                Forms\Components\TextInput::make('time_limit')
                    ->label('Time Limit (seconds)')
                    ->numeric()
                    ->minValue(0)
                    ->suffix('seconds')
                    ->nullable(),
                
                Forms\Components\Select::make('difficulty')
                    ->options([
                        1 => 'Very Easy',
                        2 => 'Easy',
                        3 => 'Medium',
                        4 => 'Hard',
                        5 => 'Very Hard',
                    ])
                    ->default(3),
                
                Forms\Components\Toggle::make('is_active')
                    ->label('Active')
                    ->default(true),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('questionType.name')
                    ->label('Type')
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('set_number')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('total_questions')
                    ->label('Questions')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('time_limit')
                    ->label('Time Limit')
                    ->formatStateUsing(fn($state) => $state ? gmdate('i:s', $state) : 'No limit'),
                
                Tables\Columns\TextColumn::make('difficulty')
                    ->badge()
                    ->color(fn($state) => match($state) {
                        1 => 'gray',
                        2 => 'success',
                        3 => 'warning',
                        4 => 'danger',
                        5 => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn($state) => match($state) {
                        1 => 'Very Easy',
                        2 => 'Easy',
                        3 => 'Medium',
                        4 => 'Hard',
                        5 => 'Very Hard',
                        default => 'Unknown',
                    }),
                
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('question_type')
                    ->relationship('questionType', 'name')
                    ->searchable(),
                
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('set_number', 'asc')
            ->modifyQueryUsing(fn($query) => $query->with('questionType'));
    }
}