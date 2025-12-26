<?php


namespace App\Filament\Resources\QuestionResource\Pages;

use App\Filament\Resources\QuestionResource;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Section;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Actions\Action;
use Filament\Resources\Pages\Page;
use App\Models\Level;
use App\Services\QuestionBulkService;
use Illuminate\Support\Facades\Storage;

class BulkUploadQuestions extends Page
{
    protected static string $resource = QuestionResource::class;
    protected static string $view = 'filament.resources.question-resource.pages.bulk-upload-questions';
    
    public ?array $data = [];
    public bool $isProcessing = false;
    
    public function mount(): void
    {
        $this->form->fill();
    }
    
    public function getHeading(): string
    {
        return 'Bulk Upload Questions';
    }
    
    public function getSubheading(): ?string
    {
        return 'Upload multiple questions via CSV file';
    }
    
    public function form(Form $form): Form
    {
        $service = app(QuestionBulkService::class);
        $levels = $service->getLevelsForDropdown();
        
        return $form
            ->schema([
                Section::make('Import Questions')
                    ->description('Upload a CSV file with questions for multiple levels/weeks')
                    ->schema([
                        Select::make('level_slug')
                            ->label('Level (for template download)')
                            ->options($levels)
                            ->required()
                            ->searchable()
                            ->preload()
                            ->helperText('Select level for downloading template. CSV can contain multiple levels.'),
                        
                        FileUpload::make('csv_file')
                            ->label('CSV File')
                            ->acceptedFileTypes(['text/csv', 'text/plain', 'application/csv'])
                            ->required()
                            ->disk('local')
                            ->directory('question-imports')
                            ->preserveFilenames()
                            ->helperText('Download template first to see the format. CSV can contain questions for multiple levels and weeks.'),
                        
                        Toggle::make('dry_run')
                            ->label('Dry Run (Validate only, no import)')
                            ->default(false)
                            ->helperText('Check for errors without importing'),

                        \Filament\Forms\Components\Actions::make([
                        \Filament\Forms\Components\Actions\Action::make('submit')
                            ->label('Import Questions')
                            ->action('importQuestions')
                            ->color('success')
                            ->icon('heroicon-o-cloud-arrow-up')
                            ->disabled(fn() => $this->isProcessing),
                    ])->fullWidth(),

                    ]),
            ])
            ->statePath('data');
    }
    
    public function downloadTemplate()
    {
        $service = app(QuestionBulkService::class);
        $csvContent = $service->generateTemplate(false);
        
        $filename = 'questions_bulk_template_' . date('Y-m-d') . '.csv';
        
        return response()->streamDownload(
            function () use ($csvContent) {
                echo $csvContent;
            },
            $filename,
            [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]
        );
    }
    
    public function downloadTemplateWithSamples()
    {
        $service = app(QuestionBulkService::class);
        $csvContent = $service->generateTemplate(true);
        
        $filename = 'questions_bulk_template_with_samples_' . date('Y-m-d') . '.csv';
        
        return response()->streamDownload(
            function () use ($csvContent) {
                echo $csvContent;
            },
            $filename,
            [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]
        );
    }
    
    public function downloadTemplateForSelectedLevel()
    {
        $data = $this->form->getState();
        $levelSlug = $data['level_slug'] ?? null;
        
        if (!$levelSlug) {
            Notification::make()
                ->title('Error')
                ->body('Please select a level first')
                ->danger()
                ->send();
            return;
        }
        
        $service = app(QuestionBulkService::class);
        $csvContent = $service->generateTemplate(false);
        
        $level = Level::where('slug', $levelSlug)->first();
        $filename = 'questions_template_' . ($level ? $level->name : '') . '_' . date('Y-m-d') . '.csv';
        
        return response()->streamDownload(
            function () use ($csvContent) {
                echo $csvContent;
            },
            $filename,
            [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]
        );
    }
    
    public function importQuestions(): void
    {
        $this->isProcessing = true;
        
        try {
            $data = $this->form->getState();
            $filePath = $data['csv_file'];
            
            if (!Storage::exists($filePath)) {
                throw new \Exception('File not found');
            }
            
            $content = Storage::get($filePath);
            $service = app(QuestionBulkService::class);
            
            $result = $service->importFromCsv($content, $data['dry_run'] ?? false);
            
            if (empty($result['errors'])) {
                Notification::make()
                    ->title('Import Successful!')
                    ->body("Imported: {$result['imported']} questions, Updated: {$result['updated']} questions, Skipped: {$result['skipped']} questions")
                    ->success()
                    ->send();
                    
                // Clear the form
                $this->form->fill();
            } else {
                $errorCount = count($result['errors']);
                $errorMessage = $errorCount > 5 ? 
                    "First 5 errors: " . implode("\n", array_slice($result['errors'], 0, 5)) . "\n... and " . ($errorCount - 5) . " more errors" :
                    implode("\n", $result['errors']);
                
                Notification::make()
                    ->title('Import Completed with Errors')
                    ->body("Imported: {$result['imported']}, Updated: {$result['updated']}, Skipped: {$result['skipped']}, Errors: {$errorCount}\n\n{$errorMessage}")
                    ->warning()
                    ->persistent()
                    ->send();
                    
                // Log all errors
                foreach ($result['errors'] as $error) {
                    \Log::warning("CSV Import Error: {$error}");
                }
            }
            
        } catch (\Exception $e) {
            Notification::make()
                ->title('Import Failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
                
            \Log::error('CSV Import Error: ' . $e->getMessage());
        } finally {
            $this->isProcessing = false;
            $this->dispatch('import-finished');
        }
    }
    
    protected function getHeaderActions(): array
    {
        return [
            Action::make('downloadTemplate')
                ->label('Download Template (Empty)')
                ->action('downloadTemplate')
                ->color('primary')
                ->icon('heroicon-o-document-arrow-down'),
                
            Action::make('downloadTemplateWithSamples')
                ->label('Download Template (With Samples)')
                ->action('downloadTemplateWithSamples')
                ->color('secondary')
                ->icon('heroicon-o-document-text'),
                
            Action::make('back')
                ->label('Back to Questions')
                ->url(QuestionResource::getUrl('index'))
                ->color('gray')
                ->icon('heroicon-o-arrow-left'),
        ];
    }
    
    protected function getFormActions(): array
    {
        return [
            Action::make('import')
                ->label('Import Questions')
                ->action('importQuestions')
                ->color('success')
                ->disabled(fn () => $this->isProcessing)
                ->icon('heroicon-o-cloud-arrow-up'),
        ];
    }
}

// namespace App\Filament\Resources\QuestionResource\Pages;

// use App\Filament\Resources\QuestionResource;
// use Filament\Forms\Components\FileUpload;
// use Filament\Forms\Components\Select;
// use Filament\Forms\Components\Toggle;
// use Filament\Forms\Components\Section;
// use Filament\Forms\Form;
// use Filament\Notifications\Notification;
// use Filament\Actions\Action;
// use Filament\Resources\Pages\Page;
// use App\Models\Level;
// use App\Services\QuestionBulkService;
// use Illuminate\Support\Facades\Storage;

// class BulkUploadQuestions extends Page
// {
//     protected static string $resource = QuestionResource::class;
//     protected static string $view = 'filament.resources.question-resource.pages.bulk-upload-questions';
    
//     public ?array $data = [];
//     public bool $isProcessing = false;
    
//     public function mount(): void
//     {
//         $this->form->fill();
//     }
    
//     public function getHeading(): string
//     {
//         return 'Bulk Upload Questions';
//     }
    
//     public function getSubheading(): ?string
//     {
//         return 'Upload multiple questions via CSV file';
//     }
    
//     public function form(Form $form): Form
//     {
//         return $form
//             ->schema([
//                 Section::make('Import Questions')
//                     ->description('Upload a CSV file with questions')
//                     ->schema([
//                         Select::make('level_id')
//                             ->label('Level')
//                             ->options(Level::all()->pluck('name', 'id'))
//                             ->required()
//                             ->searchable()
//                             ->preload(),
                        
//                         FileUpload::make('csv_file')
//                             ->label('CSV File')
//                             ->acceptedFileTypes(['text/csv', 'text/plain', 'application/csv'])
//                             ->required()
//                             ->disk('local')
//                             ->directory('question-imports')
//                             ->preserveFilenames()
//                             ->helperText('Download template first to see the format'),
                        
//                         Toggle::make('dry_run')
//                             ->label('Dry Run (Validate only, no import)')
//                             ->default(false)
//                             ->helperText('Check for errors without importing'),

//                          \Filament\Forms\Components\Actions::make([
//                         \Filament\Forms\Components\Actions\Action::make('submit')
//                             ->label('Import Questions')
//                             ->action('importQuestions')
//                             ->color('success')
//                             ->icon('heroicon-o-cloud-arrow-up')
//                             ->disabled(fn() => $this->isProcessing),
//                     ])->fullWidth(),

//                     ]),
//             ])
//             ->statePath('data');
//     }
    
//     public function downloadTemplate()
//     {
//         $service = app(QuestionBulkService::class);
//         $csvContent = $service->generateTemplate(false);
        
//         $filename = 'questions_bulk_template_' . date('Y-m-d') . '.csv';
        
//         return response()->streamDownload(
//             function () use ($csvContent) {
//                 echo $csvContent;
//             },
//             $filename,
//             [
//                 'Content-Type' => 'text/csv',
//                 'Content-Disposition' => 'attachment; filename="' . $filename . '"',
//             ]
//         );
//     }
    
//     public function downloadTemplateWithSamples()
//     {
//         $service = app(QuestionBulkService::class);
//         $csvContent = $service->generateTemplate(true);
        
//         $filename = 'questions_bulk_template_with_samples_' . date('Y-m-d') . '.csv';
        
//         return response()->streamDownload(
//             function () use ($csvContent) {
//                 echo $csvContent;
//             },
//             $filename,
//             [
//                 'Content-Type' => 'text/csv',
//                 'Content-Disposition' => 'attachment; filename="' . $filename . '"',
//             ]
//         );
//     }
    
//     public function importQuestions(): void
//     {
//         $this->isProcessing = true;
        
//         try {
//             $data = $this->form->getState();
//             $filePath = $data['csv_file'];
            
//             if (!Storage::exists($filePath)) {
//                 throw new \Exception('File not found');
//             }
            
//             $content = Storage::get($filePath);
//             $service = app(QuestionBulkService::class);
            
//             $result = $service->importFromCsv($content, $data['level_id'], $data['dry_run'] ?? false);
            
//             if (empty($result['errors'])) {
//                 Notification::make()
//                     ->title('Import Successful!')
//                     ->body("Imported: {$result['imported']}, Updated: {$result['updated']}, Skipped: {$result['skipped']}")
//                     ->success()
//                     ->send();
                    
//                 // Clear the form
//                 $this->form->fill();
//             } else {
//                 Notification::make()
//                     ->title('Import Completed with Errors')
//                     ->body("Imported: {$result['imported']}, Errors: " . count($result['errors']))
//                     ->warning()
//                     ->send();
                    
//                 // Log errors
//                 foreach ($result['errors'] as $error) {
//                     \Log::warning("CSV Import Error: {$error}");
//                 }
//             }
            
//         } catch (\Exception $e) {
//             Notification::make()
//                 ->title('Import Failed')
//                 ->body($e->getMessage())
//                 ->danger()
//                 ->send();
                
//             \Log::error('CSV Import Error: ' . $e->getMessage());
//         } finally {
//             $this->isProcessing = false;
//             $this->dispatch('import-finished');
//         }
//     }
    
//     protected function getHeaderActions(): array
//     {
//         return [
//             Action::make('downloadTemplate')
//                 ->label('Download Template')
//                 ->action('downloadTemplate')
//                 ->color('primary')
//                 ->icon('heroicon-o-document-arrow-down'),
                
//             Action::make('downloadTemplateWithSamples')
//                 ->label('Download Template with Samples')
//                 ->action('downloadTemplateWithSamples')
//                 ->color('secondary')
//                 ->icon('heroicon-o-document-text'),
                
//             Action::make('back')
//                 ->label('Back to Questions')
//                 ->url(QuestionResource::getUrl('index'))
//                 ->color('gray')
//                 ->icon('heroicon-o-arrow-left'),
//         ];
//     }
    
//     protected function getFormActions(): array
//     {
//         return [
//             Action::make('import')
//                 ->label('Import Questions')
//                 ->action('importQuestions')
//                 ->color('success')
//                 ->disabled(fn () => $this->isProcessing)
//                 ->icon('heroicon-o-cloud-arrow-up'),
//         ];
//     }
// }