<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Level;
use App\Models\Week;
use App\Models\QuestionType;
use App\Models\QuestionSet;
use App\Models\Question;
use League\Csv\Reader;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ImportQuestionsFromCsv extends Command
{
    protected $signature = 'questions:import-csv 
                            {file : Path to CSV file}
                            {--level= : Level ID or name}
                            {--dry-run : Validate without importing}';
    
    protected $description = 'Import questions from CSV file';

    private $levelId;
    private $errors = [];
    private $importedCount = 0;
    private $skippedCount = 0;

    public function handle()
    {
        $filePath = $this->argument('file');
        $levelInput = $this->option('level');
        $dryRun = $this->option('dry-run');
        
        // Resolve level
        if (!$this->resolveLevel($levelInput)) {
            return Command::FAILURE;
        }
        
        // Read CSV file
        $csv = $this->readCsv($filePath);
        if (!$csv) {
            return Command::FAILURE;
        }
        
        $this->info("Processing CSV file: {$filePath}");
        $this->info("Level ID: {$this->levelId}");
        $this->info("Dry run: " . ($dryRun ? 'Yes' : 'No'));
        
        // Process in transaction
        DB::beginTransaction();
        
        try {
            $this->processCsv($csv, $dryRun);
            
            if (empty($this->errors)) {
                if (!$dryRun) {
                    DB::commit();
                    $this->info("\n✅ Import completed successfully!");
                    $this->info("Imported: {$this->importedCount} questions");
                    $this->info("Skipped: {$this->skippedCount} questions");
                } else {
                    DB::rollBack();
                    $this->info("\n✅ Dry run completed - no errors found!");
                    $this->info("Would import: {$this->importedCount} questions");
                    $this->info("Would skip: {$this->skippedCount} questions");
                }
                return Command::SUCCESS;
            } else {
                DB::rollBack();
                $this->error("\n❌ Import failed with errors:");
                foreach ($this->errors as $error) {
                    $this->error("  - {$error}");
                }
                return Command::FAILURE;
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Import failed: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
            return Command::FAILURE;
        }
    }
    
    private function resolveLevel($levelInput): bool
    {
        if (empty($levelInput)) {
            $this->error("Level is required. Use --level=ID or --level=name");
            return false;
        }
        
        $level = is_numeric($levelInput) 
            ? Level::find($levelInput)
            : Level::where('name', $levelInput)->first();
        
        if (!$level) {
            $this->error("Level not found: {$levelInput}");
            return false;
        }
        
        $this->levelId = $level->id;
        return true;
    }
    
    private function readCsv(string $filePath)
    {
        if (!file_exists($filePath) && !Storage::exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return null;
        }
        
        try {
            $content = file_exists($filePath) 
                ? file_get_contents($filePath)
                : Storage::get($filePath);
            
            $csv = Reader::createFromString($content);
            $csv->setHeaderOffset(0);
            return $csv;
        } catch (\Exception $e) {
            $this->error("Failed to read CSV: " . $e->getMessage());
            return null;
        }
    }
    
    private function processCsv($csv, bool $dryRun): void
    {
        $requiredHeaders = [
            'week_number', 'week_type', 'week_title', 'set_name',
            'set_number', 'question_type_name', 'question_number',
            'digits', 'operators', 'formatted_question', 'answer'
        ];
        
        $headers = $csv->getHeader();
        foreach ($requiredHeaders as $required) {
            if (!in_array($required, $headers)) {
                $this->errors[] = "Missing required column: {$required}";
                return;
            }
        }
        
        $this->importedCount = 0;
        $this->skippedCount = 0;
        
        foreach ($csv as $index => $row) {
            $rowNumber = $index + 2; // +2 for 1-based index and header row
            
            try {
                // Validate row
                $validator = Validator::make($row, [
                    'week_number' => 'required|integer|min:1',
                    'week_type' => 'required|in:regular,multiplication',
                    'week_title' => 'required|string',
                    'set_name' => 'required|string',
                    'set_number' => 'required|integer|min:10',
                    'question_type_name' => 'required|string',
                    'question_number' => 'required|integer|min:1',
                    'digits' => 'required|json',
                    'operators' => 'required|json',
                    'formatted_question' => 'required|string',
                    'answer' => 'required|numeric',
                    'time_limit' => 'nullable|integer|min:1',
                ]);
                
                if ($validator->fails()) {
                    $this->skippedCount++;
                    $this->warn("Row {$rowNumber} skipped: " . implode(', ', $validator->errors()->all()));
                    continue;
                }
                
                // Process the row
                $this->processRow($row, $dryRun);
                $this->importedCount++;
                
                if ($this->importedCount % 50 === 0) {
                    $this->info("Processed {$this->importedCount} questions...");
                }
                
            } catch (\Exception $e) {
                $this->skippedCount++;
                $this->warn("Row {$rowNumber} error: " . $e->getMessage());
            }
        }
    }
    
    private function processRow(array $row, bool $dryRun): void
    {
        // Get or create week
        $week = Week::firstOrCreate(
            [
                'level_id' => $this->levelId,
                'week_number' => $row['week_number'],
            ],
            [
                'week_type' => $row['week_type'],
                'title' => $row['week_title'],
                'is_active' => true,
            ]
        );
        
        // Get question type
        $questionType = QuestionType::where('name', $row['question_type_name'])->first();
        if (!$questionType) {
            throw new \Exception("Question type not found: {$row['question_type_name']}");
        }
        
        // Get or create question set
        $questionSet = QuestionSet::firstOrCreate(
            [
                'week_id' => $week->id,
                'question_type_id' => $questionType->id,
                'set_number' => $row['set_number'],
            ],
            [
                'name' => $row['set_name'],
                'total_questions' => 0, // Will be updated
                'difficulty' => 1,
                'is_active' => true,
            ]
        );
        
        // Check if question already exists
        $existingQuestion = Question::where('question_set_id', $questionSet->id)
            ->where('question_number', $row['question_number'])
            ->first();
        
        if ($existingQuestion && !$dryRun) {
            // Update existing question
            $existingQuestion->update([
                'digits' => json_decode($row['digits'], true),
                'operators' => json_decode($row['operators'], true),
                'formatted_question' => $row['formatted_question'],
                'answer' => $row['answer'],
                'time_limit' => $row['time_limit'] ?? null,
                'question_type_id' => $questionType->id,
            ]);
        } elseif (!$dryRun) {
            // Create new question
            Question::create([
                'question_set_id' => $questionSet->id,
                'question_type_id' => $questionType->id,
                'question_number' => $row['question_number'],
                'digits' => json_decode($row['digits'], true),
                'operators' => json_decode($row['operators'], true),
                'formatted_question' => $row['formatted_question'],
                'answer' => $row['answer'],
                'time_limit' => $row['time_limit'] ?? null,
                'is_auto_generated' => false,
            ]);
        }
        
        // Update question set count (if not dry run)
        if (!$dryRun) {
            $questionSet->update([
                'total_questions' => Question::where('question_set_id', $questionSet->id)->count()
            ]);
            
            $week->update([
                'total_sets' => QuestionSet::where('week_id', $week->id)->count()
            ]);
        }
    }
}