<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WeekResource\Pages;
use App\Filament\Resources\WeekResource\RelationManagers;
use App\Models\Level;
use App\Models\Week;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class WeekResource extends Resource
{
    protected static ?string $model = Week::class;

    protected static ?string $navigationIcon = 'heroicon-o-calendar';
    protected static ?string $navigationGroup = 'Content Management';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Week Information')
                    ->schema([
                        Forms\Components\Select::make('level_id')
                            ->label('Level')
                            ->options(Level::all()->pluck('name', 'id'))
                            ->searchable()
                            ->required(),
                        
                        Forms\Components\TextInput::make('week_number')
                            ->numeric()
                            ->required()
                            ->minValue(1)
                            ->maxValue(100),

                         Forms\Components\Select::make('week_type')
                            ->label('Week Type')
                            ->options([
                                'regular' => 'Regular',
                                'multiplication' => 'Multiplication',
                            ])
                            ->default('regular')
                            ->required(),
                        
                        Forms\Components\TextInput::make('title')
                            ->required()
                            ->maxLength(255),
                        
                        Forms\Components\TextInput::make('total_sets')
                            ->numeric()
                            ->default(0)
                            ->minValue(0),
                    ])->columns(2),
                
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
                Tables\Columns\TextColumn::make('level.name')
                    ->label('Level')
                    ->searchable()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('week_number')
                    ->numeric()
                    ->sortable(),

                Tables\Columns\TextColumn::make('week_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn($state) => match($state) {
                        'regular' => 'primary',
                        'multiplication' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn($state) => ucfirst($state))
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('total_sets')
                    ->label('Sets')
                    ->numeric()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('questionSets.count')
                    ->label('Active Sets')
                    ->counts('questionSets')
                    ->badge()
                    ->color('primary'),
                
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
                Tables\Filters\SelectFilter::make('level')
                    ->relationship('level', 'name')
                    ->searchable(),
                
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
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
            ->defaultSort('level_id', 'asc')
            ->modifyQueryUsing(fn($query) => $query->with('level'));
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\QuestionSetsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWeeks::route('/'),
            'create' => Pages\CreateWeek::route('/create'),
            'edit' => Pages\EditWeek::route('/{record}/edit'),
        ];
    }
}