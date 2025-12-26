<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuestionSetResource\Pages;
use App\Filament\Resources\QuestionSetResource\RelationManagers;
use App\Models\QuestionSet;
use App\Models\QuestionType;
use App\Models\Week;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class QuestionSetResource extends Resource
{
    protected static ?string $model = QuestionSet::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Content Management';
    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Set Information')
                    ->schema([
                        Forms\Components\Select::make('week_id')
                            ->label('Week')
                            ->options(Week::with('level')->get()->mapWithKeys(function ($week) {
                                return [$week->id => "{$week->level->name} → Week {$week->week_number}"];
                            }))
                            ->searchable()
                            ->required(),
                        
                        Forms\Components\Select::make('question_type_id')
                            ->label('Question Type')
                            ->options(QuestionType::all()->pluck('name', 'id'))
                            ->searchable()
                            ->required(),
                        
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Set 1'),
                        
                        Forms\Components\TextInput::make('set_number')
                            ->numeric()
                            ->required()
                            ->minValue(1)
                            ->default(10),
                    ])->columns(2),
                
                Forms\Components\Section::make('Configuration')
                    ->schema([
                        Forms\Components\TextInput::make('total_questions')
                            ->numeric()
                            ->required()
                            ->minValue(1)
                            ->default(8)
                            ->helperText('Number of questions in this set'),
                        
                        Forms\Components\TextInput::make('time_limit')
                            ->label('Time Limit (seconds)')
                            ->numeric()
                            ->minValue(0)
                            ->suffix('seconds')
                            ->nullable()
                            ->helperText('Set 0 for no time limit'),
                        
                        Forms\Components\Select::make('difficulty')
                            ->options([
                                1 => '⭐ Very Easy',
                                2 => '⭐⭐ Easy',
                                3 => '⭐⭐⭐ Medium',
                                4 => '⭐⭐⭐⭐ Hard',
                                5 => '⭐⭐⭐⭐⭐ Very Hard',
                            ])
                            ->default(3),
                    ])->columns(3),
                
                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->inline(false),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('full_path')
                    ->label('Path')
                    ->searchable(['name', 'week.title', 'week.level.name'])
                    ->sortable(['week.level.order', 'week.week_number', 'set_number'])
                    ->limit(50)
                    ->tooltip(fn($record) => $record->full_path),
                
                Tables\Columns\TextColumn::make('questionType.name')
                    ->label('Type')
                    ->sortable()
                    ->badge()
                    ->color('primary'),
                
                Tables\Columns\TextColumn::make('set_number')
                    ->label('Set #')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('total_questions')
                    ->label('Questions')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('time_limit')
                    ->label('Time Limit')
                    ->formatStateUsing(fn($state) => $state ? gmdate('i:s', $state) : 'No limit')
                    ->sortable(),
                
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
                    ->formatStateUsing(fn($state) => str_repeat('⭐', $state)),
                
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('week')
                    ->relationship('week', 'title')
                    ->searchable(),
                
                Tables\Filters\SelectFilter::make('questionType')
                    ->relationship('questionType', 'name')
                    ->searchable(),
                
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
                
                Tables\Filters\SelectFilter::make('difficulty')
                    ->options([
                        1 => 'Very Easy',
                        2 => 'Easy',
                        3 => 'Medium',
                        4 => 'Hard',
                        5 => 'Very Hard',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\ViewAction::make(),
                Tables\Actions\Action::make('view_questions')
                    ->label('Questions')
                    ->url(fn($record) => QuestionSetResource::getUrl('view', ['record' => $record]))
                    ->icon('heroicon-o-eye'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('activate')
                        ->action(fn($records) => $records->each->update(['is_active' => true])),
                    Tables\Actions\BulkAction::make('deactivate')
                        ->action(fn($records) => $records->each->update(['is_active' => false])),
                ]),
            ])
            ->defaultSort('week_id')
            ->modifyQueryUsing(fn($query) => $query->with(['week.level', 'questionType']));
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\QuestionsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuestionSets::route('/'),
            'create' => Pages\CreateQuestionSet::route('/create'),
            'edit' => Pages\EditQuestionSet::route('/{record}/edit'),
            'view' => Pages\ViewQuestionSet::route('/{record}'),
        ];
    }
}