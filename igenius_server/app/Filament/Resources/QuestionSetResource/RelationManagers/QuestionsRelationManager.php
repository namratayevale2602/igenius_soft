<?php

namespace App\Filament\Resources\QuestionSetResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Arr;

class QuestionsRelationManager extends RelationManager
{
    protected static string $relationship = 'questions';

    protected static ?string $recordTitleAttribute = 'question_number';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('question_number')
                    ->numeric()
                    ->required()
                    ->minValue(1)
                    ->maxValue(100)
                    ->default(10),
                
                Forms\Components\Section::make('Grid Data')
                    ->description('5 rows × 10 columns of numbers')
                    ->schema([
                        Forms\Components\Repeater::make('data.grid')
                            ->label('Rows')
                            ->schema([
                                Forms\Components\Repeater::make('columns')
                                    ->label('Row')
                                    ->schema([
                                        Forms\Components\TextInput::make('value')
                                            ->label('')
                                            ->numeric()
                                            ->required()
                                            ->default(0),
                                    ])
                                    ->grid(10)
                                    ->defaultItems(10)
                                    ->itemLabel(fn($state) => '')
                                    ->collapsible(),
                            ])
                            ->defaultItems(5)
                            ->itemLabel(fn($state, $index) => "Row " . ($index + 1))
                            ->collapsible(),
                    ])
                    ->columnSpanFull(),
                
                Forms\Components\Section::make('Calculated Answers')
                    ->description('Will be calculated automatically')
                    ->schema([
                        Forms\Components\Repeater::make('answers')
                            ->label('Column Answers')
                            ->schema([
                                Forms\Components\TextInput::make('value')
                                    ->label('')
                                    ->numeric()
                                    ->disabled()
                                    ->default(0),
                            ])
                            ->grid(10)
                            ->defaultItems(10)
                            ->itemLabel(fn($state, $index) => "Col " . ($index + 1))
                            ->dehydrated(false)
                            ->disableItemCreation()
                            ->disableItemDeletion()
                            ->disableItemMovement(),
                    ])
                    ->columnSpanFull(),
                
                Forms\Components\Select::make('difficulty')
                    ->options([
                        'easy' => 'Easy',
                        'medium' => 'Medium',
                        'hard' => 'Hard',
                    ])
                    ->default('medium'),
                
                Forms\Components\TextInput::make('time_estimate')
                    ->label('Time Estimate (seconds)')
                    ->numeric()
                    ->minValue(0)
                    ->suffix('seconds')
                    ->nullable(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('question_number')
                    ->label('Q#')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('grid_info')
                    ->label('Grid')
                    ->formatStateUsing(function ($record) {
                        $data = $record->data ?? [];
                        $rows = count(Arr::get($data, 'grid', []));
                        $cols = count(Arr::get($data, 'grid.0', []));
                        return "{$rows}×{$cols}";
                    })
                    ->badge()
                    ->color('primary'),
                
                Tables\Columns\TextColumn::make('difficulty')
                    ->badge()
                    ->color(function ($state) {
                        return match($state) {
                            'easy' => 'success',
                            'medium' => 'warning',
                            'hard' => 'danger',
                            default => 'gray',
                        };
                    }),
                
                Tables\Columns\TextColumn::make('time_estimate')
                    ->label('Time Est.')
                    ->formatStateUsing(fn($state) => $state ? "{$state}s" : '-')
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('difficulty')
                    ->options([
                        'easy' => 'Easy',
                        'medium' => 'Medium',
                        'hard' => 'Hard',
                    ]),
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
            ->defaultSort('question_number', 'asc');
    }
}