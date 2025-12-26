<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use League\Csv\Writer;
use Illuminate\Support\Facades\Storage;

class GenerateQuestionsCsvTemplate extends Command
{
    protected $signature = 'questions:csv-template {--sample-data : Include sample data rows}';
    protected $description = 'Generate CSV template for bulk question upload';

    public function handle()
    {
        $includeSampleData = $this->option('sample-data');
        
        // Create CSV writer
        $csv = Writer::createFromString('');
        
        // Headers
        $headers = [
            'week_number',
            'week_type',
            'week_title',
            'set_name',
            'set_number',
            'question_type_name',
            'question_number',
            'digits',
            'operators',
            'formatted_question',
            'answer',
            'time_limit'
        ];
        
        $csv->insertOne($headers);
        
        // Add sample data if requested
        if ($includeSampleData) {
            $sampleRows = $this->getSampleRows();
            $csv->insertAll($sampleRows);
        }
        
        // Generate filename
        $filename = $includeSampleData ? 'questions_bulk_template_with_samples.csv' : 'questions_bulk_template.csv';
        
        // Save to storage
        $path = 'templates/' . $filename;
        Storage::disk('public')->put($path, $csv->toString());
        
        // Generate download link
        $fullPath = Storage::disk('public')->path($path);
        
        $this->info("CSV template generated successfully!");
        $this->info("Download path: " . storage_path('app/public/' . $path));
        $this->info("Web URL: " . asset('storage/' . $path));
        
        return Command::SUCCESS;
    }
    
    private function getSampleRows(): array
    {
        return [
            [1, 'regular', '1st Week', 'Set 1', 10, 'Addition/Subtraction', 1, '[3,4]', '["+"]', '3 + 4', 7, 30],
            [1, 'regular', '1st Week', 'Set 1', 10, 'Addition/Subtraction', 2, '[5,2]', '["-"]', '5 - 2', 3, 30],
            [1, 'regular', '1st Week', 'Set 2', 20, 'Multiplication', 1, '[3,4]', '["*"]', '3 × 4', 12, 30],
            [2, 'multiplication', '2nd Week', 'Set 1', 10, 'Multiplication', 1, '[5,6]', '["*"]', '5 × 6', 30, 30],
            [2, 'multiplication', '2nd Week', 'Set 1', 10, 'Multiplication', 2, '[7,8]', '["*"]', '7 × 8', 56, 30],
        ];
    }
}