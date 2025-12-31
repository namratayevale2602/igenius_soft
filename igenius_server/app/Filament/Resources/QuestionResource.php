<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuestionResource\Pages;
use App\Filament\Resources\QuestionResource\Pages\BulkUploadQuestions;
use App\Models\Question;
use App\Models\QuestionSet;
use App\Models\QuestionType;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Navigation\NavigationItem;
use Illuminate\Support\Str;
use Filament\Forms\Components\Wizard;
use Filament\Forms\Components\Wizard\Step;

class QuestionResource extends Resource
{
    protected static ?string $model = Question::class;
    protected static ?string $navigationIcon = 'heroicon-o-question-mark-circle';
    protected static ?string $navigationGroup = 'Question Bank';
     protected static ?string $navigationLabel = 'Questions';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Wizard::make([
                    Step::make('Basic Information')
                        ->schema([
                            Forms\Components\Select::make('question_set_id')
                                ->relationship('questionSet', 'name')
                                ->required()
                                ->reactive()
                                ->afterStateUpdated(function ($state, callable $set) {
                                    if ($state) {
                                        $questionSet = QuestionSet::find($state);
                                        if ($questionSet) {
                                            $set('question_type_id', $questionSet->question_type_id);
                                        }
                                    }
                                }),
                            
                            Forms\Components\Select::make('question_type_id')
                                ->relationship('questionType', 'name')
                                ->required()
                                ->disabled(fn($get) => !$get('question_set_id')),
                            
                            Forms\Components\TextInput::make('question_number')
                                ->required()
                                ->numeric()
                                ->minValue(1)
                                ->default(1),
                            
                            Forms\Components\TextInput::make('time_limit')
                                ->numeric()
                                ->minValue(1)
                                ->suffix('seconds')
                                ->helperText('Leave empty to use set default'),
                        ]),
                    
                    Step::make('Question Details')
                        ->schema([
                            Forms\Components\Repeater::make('digits')
                                ->label('Digits/Operands')
                                ->schema([
                                    Forms\Components\TextInput::make('digit')
                                        ->required()
                                        ->numeric()
                                        ->minValue(0)
                                        ->maxValue(999)
                                        ->default(0)
                                ])
                                ->minItems(2)
                                ->maxItems(6)
                                ->required()
                                ->live()
                                ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                    self::calculateAndSetAnswer($state, $get('operators'), $set);
                                }),
                            
                            Forms\Components\Repeater::make('operators')
                                ->label('Operators')
                                ->schema([
                                    Forms\Components\Select::make('operator')
                                        ->required()
                                        ->options([
                                            '+' => 'Addition (+)',
                                            '-' => 'Subtraction (-)',
                                            '*' => 'Multiplication (×)',
                                            '/' => 'Division (÷)',
                                        ])
                                        ->default('+')
                                ])
                                ->minItems(1)
                                ->maxItems(5)
                                ->required()
                                ->live()
                                ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                    self::calculateAndSetAnswer($get('digits'), $state, $set);
                                }),
                            
                            Forms\Components\TextInput::make('formatted_question')
                                ->label('Preview')
                                ->disabled()
                                ->dehydrated(false)
                                ->helperText('Auto-generated from digits and operators')
                                ->formatStateUsing(function ($state, callable $get) {
                                    $digits = collect($get('digits'))->pluck('digit')->toArray();
                                    $operators = collect($get('operators'))->pluck('operator')->toArray();
                                    
                                    if (empty($digits)) {
                                        return '';
                                    }
                                    
                                    $display = '';
                                    foreach ($digits as $index => $digit) {
                                        $display .= $digit;
                                        if (isset($operators[$index])) {
                                            $display .= ' ' . 
                                                match($operators[$index]) {
                                                    '*' => '×',
                                                    '/' => '÷',
                                                    default => $operators[$index]
                                                } . ' ';
                                        }
                                    }
                                    
                                    return trim($display);
                                }),
                            
                            Forms\Components\TextInput::make('answer')
                                ->required()
                                ->numeric()
                                ->step(0.01)
                                ->helperText('Auto-calculated from digits and operators')
                                ->disabled()
                                ->dehydrated()
                                ->formatStateUsing(fn($state) => round($state, 2)),
                        ]),
                ])
                ->skippable()
                ->persistStepInQueryString(),
            ]);
    }

    private static function calculateAndSetAnswer($digitsState, $operatorsState, callable $set): void
    {
        $digits = collect($digitsState)->pluck('digit')->filter()->toArray();
        $operators = collect($operatorsState)->pluck('operator')->toArray();
        
        if (count($digits) < 2 || count($operators) < 1) {
            $set('answer', 0);
            return;
        }
        
        // Calculate answer
        $result = $digits[0];
        for ($i = 1; $i < count($digits); $i++) {
            $operator = $operators[$i - 1] ?? '+';
            $nextDigit = $digits[$i];
            
            switch ($operator) {
                case '+':
                    $result += $nextDigit;
                    break;
                case '-':
                    $result -= $nextDigit;
                    break;
                case '*':
                    $result *= $nextDigit;
                    break;
                case '/':
                    if ($nextDigit != 0) {
                        $result /= $nextDigit;
                    }
                    break;
            }
        }
        
        $set('answer', round($result, 2));
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('question_number')
                    ->sortable()
                    ->searchable(),
                
                Tables\Columns\TextColumn::make('questionSet.name')
                    ->sortable()
                    ->searchable()
                    ->url(fn($record) => QuestionSetResource::getUrl('edit', [$record->question_set_id])),
                
                Tables\Columns\TextColumn::make('questionType.name')
                    ->sortable()
                    ->searchable(),
                
                Tables\Columns\TextColumn::make('display_question')
                    ->label('Question')
                    ->wrap()
                    ->html()
                    ->formatStateUsing(fn($record) => 
                        str_replace(
                            ['*', '/'],
                            ['×', '÷'],
                            $record->display_question
                        )
                    ),
                
                Tables\Columns\TextColumn::make('answer')
                    ->sortable()
                    ->formatStateUsing(fn($state) => round($state, 2)),
                
                Tables\Columns\TextColumn::make('operation_types')
                    ->label('Operations')
                    ->badge()
                    ->separator(',')
                    ->color('success'),
                
                Tables\Columns\IconColumn::make('is_auto_generated')
                    ->boolean()
                    ->label('Auto'),
                
                Tables\Columns\TextColumn::make('time_limit')
                    ->suffix('s')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('question_set_id')
                    ->relationship('questionSet', 'name')
                    ->label('Question Set'),
                
                Tables\Filters\SelectFilter::make('question_type_id')
                    ->relationship('questionType', 'name')
                    ->label('Question Type'),
                
                Tables\Filters\TernaryFilter::make('is_auto_generated')
                    ->label('Auto Generated'),
                
                Tables\Filters\SelectFilter::make('operations')
                    ->label('Contains Operation')
                    ->options([
                        '+' => 'Addition',
                        '-' => 'Subtraction',
                        '*' => 'Multiplication',
                        '/' => 'Division',
                    ])
                    ->query(function ($query, $data) {
                        if (!empty($data['value'])) {
                            $query->whereJsonContains('operators', $data['value']);
                        }
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\Action::make('preview')
                    ->icon('heroicon-o-eye')
                    ->modalContent(fn($record) => view('filament.pages.question-preview', ['question' => $record]))
                    ->modalSubmitAction(false),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('generate_more')
                        ->icon('heroicon-o-plus')
                        ->form([
                            Forms\Components\TextInput::make('count')
                                ->numeric()
                                ->minValue(1)
                                ->maxValue(20)
                                ->default(5)
                                ->required(),
                        ])
                        ->action(function ($records, $data) {
                            // Logic to generate more similar questions
                        }),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuestions::route('/'),
            'create' => Pages\CreateQuestion::route('/create'),
            'edit' => Pages\EditQuestion::route('/{record}/edit'),
            'bulk-upload' => BulkUploadQuestions::route('/bulk-upload'),
        ];
    }

    public static function getNavigationItems(): array
    {
        return [
            NavigationItem::make()
                ->label('Questions')
                ->icon('heroicon-o-question-mark-circle')
                ->isActiveWhen(fn (): bool => request()->routeIs(static::getRouteBaseName() . '.index'))
                ->url(static::getUrl('index')),
                
            NavigationItem::make()
                ->label('Bulk Upload')
                ->icon('heroicon-o-cloud-arrow-up')
                ->isActiveWhen(fn (): bool => request()->routeIs(static::getRouteBaseName() . '.bulk-upload'))
                ->url(static::getUrl('bulk-upload')),
                
            
        ];
    }
}