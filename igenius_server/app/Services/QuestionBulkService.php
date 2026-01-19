<?php


namespace App\Services;

use App\Models\Question;
use App\Models\QuestionSet;
use App\Models\Week;
use App\Models\QuestionType;
use App\Models\Level;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use League\Csv\Reader;
use League\Csv\Writer;
use Illuminate\Support\Facades\Storage;

class QuestionBulkService
{
    public function generateTemplate(bool $withSamples = false): string
    {
        $csv = Writer::createFromString('');
        
        // Updated headers based on your API structure
        $headers = [
            'level_slug',           // Added: which level to add questions to
            'week_number',          // Week number (1-10)
            'week_type',           // regular or multiplication
            'week_title',          // Week title
            'question_type_name',  // Question type name
            'set_name',            // Set name
            'set_number',          // Set number (10, 20, 30, etc.)
            'question_number',     // Question number in set
            'digits',              // JSON array of digits
            'operators',           // JSON array of operators
            'formatted_question',  // Formatted question string
            'answer',              // Calculated answer
            'time_limit',          // Time limit in seconds
            'difficulty'           // Difficulty level (1-5)
        ];
        
        $csv->insertOne($headers);
        
        if ($withSamples) {
            $samples = [
                // Beginner Level, Week 1, Addition/Subtraction, Set 1
                ['beginner-level', 1, 'regular', 'Beginner 1st Week', 'Addition/Subtraction', 'Set 1', 10, 1, '[3,4]', '["+"]', '3 + 4', 7, 30, 1],
                ['beginner-level', 1, 'regular', 'Beginner 1st Week', 'Addition/Subtraction', 'Set 1', 10, 2, '[5,2]', '["-"]', '5 - 2', 3, 30, 1],
                ['beginner-level', 1, 'regular', 'Beginner 1st Week', 'Addition/Subtraction', 'Set 1', 10, 3, '[7,3,2]', '["+","-"]', '7 + 3 - 2', 8, 30, 2],
                
                // Beginner Level, Week 1, Multiplication, Set 2
                ['beginner-level', 1, 'regular', 'Beginner 1st Week', 'Multiplication', 'Set 2', 20, 1, '[3,4]', '["*"]', '3 × 4', 12, 30, 2],
                ['beginner-level', 1, 'regular', 'Beginner 1st Week', 'Multiplication', 'Set 2', 20, 2, '[5,6]', '["*"]', '5 × 6', 30, 30, 2],
                
                // Beginner Level, Week 2, Multiplication, Set 1
                ['beginner-level', 2, 'multiplication', 'Beginner 2nd week', 'Multiplication', 'Set 1', 10, 1, '[2,3]', '["*"]', '2 × 3', 6, 30, 1],
                ['beginner-level', 2, 'multiplication', 'Beginner 2nd week', 'Multiplication', 'Set 1', 10, 2, '[4,5]', '["*"]', '4 × 5', 20, 30, 1],
                
                // 2nd Level, Week 1, Division, Set 1
                ['second-level', 1, 'regular', '2nd Level 1st Week', 'Division', 'Set 1', 10, 1, '[12,3]', '["/"]', '12 ÷ 3', 4, 30, 3],
                ['second-level', 1, 'regular', '2nd Level 1st Week', 'Division', 'Set 1', 10, 2, '[20,4]', '["/"]', '20 ÷ 4', 5, 30, 3],
            ];
            $csv->insertAll($samples);
        }
        
        return $csv->toString();
    }
    
    public function exportQuestions($levelSlug = null, $weekNumber = null): string
    {
        $csv = Writer::createFromString('');
        
        $headers = [
            'level_slug',
            'week_number',
            'week_type',
            'week_title',
            'question_type_name',
            'set_name',
            'set_number',
            'question_number',
            'digits',
            'operators',
            'formatted_question',
            'answer',
            'time_limit',
            'difficulty'
        ];
        
        $csv->insertOne($headers);
        
        $query = Question::with([
                'questionSet.week.level',
                'questionType'
            ])
            ->orderBy('question_set_id')
            ->orderBy('question_number');
            
        if ($levelSlug) {
            $query->whereHas('questionSet.week.level', function($q) use ($levelSlug) {
                $q->where('slug', $levelSlug);
            });
        }
        
        if ($weekNumber) {
            $query->whereHas('questionSet.week', function($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            });
        }
        
        $questions = $query->get();
        
        foreach ($questions as $question) {
            $csv->insertOne([
                $question->questionSet->week->level->slug,
                $question->questionSet->week->week_number,
                $question->questionSet->week->week_type,
                $question->questionSet->week->title,
                $question->questionType->name,
                $question->questionSet->name,
                $question->questionSet->set_number,
                $question->question_number,
                json_encode($question->digits),
                json_encode($question->operators),
                $question->formatted_question,
                $question->answer,
                $question->time_limit ?? $question->questionSet->time_limit,
                $question->questionSet->difficulty
            ]);
        }
        
        return $csv->toString();
    }
    
    public function importFromCsv(string $content, bool $dryRun = false): array
    {
        try {
            $csv = Reader::createFromString($content);
            $csv->setHeaderOffset(0);
        } catch (\Exception $e) {
            return [
                'imported' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => ['Invalid CSV format: ' . $e->getMessage()]
            ];
        }
        
        $results = [
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => []
        ];
        
        DB::beginTransaction();
        
        try {
            $headers = $csv->getHeader();
            $requiredHeaders = [
                'level_slug', 'week_number', 'week_type', 'week_title',
                'question_type_name', 'set_name', 'set_number', 'question_number',
                'digits', 'operators', 'formatted_question', 'answer'
            ];
            
            // Check headers
            foreach ($requiredHeaders as $required) {
                if (!in_array($required, $headers)) {
                    DB::rollBack();
                    return [
                        'imported' => 0,
                        'updated' => 0,
                        'skipped' => 0,
                        'errors' => ["Missing required column: {$required}. Available columns: " . implode(', ', $headers)]
                    ];
                }
            }
            
            foreach ($csv as $index => $row) {
                $rowNumber = $index + 2;
                
                try {
                    $result = $this->importRow($row, $dryRun);
                    
                    if ($result['status'] === 'imported') {
                        $results['imported']++;
                    } elseif ($result['status'] === 'updated') {
                        $results['updated']++;
                    } else {
                        $results['skipped']++;
                        $results['errors'][] = "Row {$rowNumber}: {$result['message']}";
                    }
                } catch (\Exception $e) {
                    $results['skipped']++;
                    $results['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
                }
            }
            
            if (!$dryRun && empty($results['errors'])) {
                DB::commit();
            } else {
                DB::rollBack();
            }
            
            return $results;
            
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'imported' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => ['System error: ' . $e->getMessage()]
            ];
        }
    }
    
    private function importRow(array $row, bool $dryRun): array
    {
        // Validation
        $validator = Validator::make($row, [
            'level_slug' => 'required|string|exists:levels,slug',
            'week_number' => 'required|integer|min:1',
            'week_type' => 'required|in:regular,multiplication',
            'week_title' => 'required|string',
            'question_type_name' => 'required|string|exists:question_types,name',
            'set_name' => 'required|string',
            'set_number' => 'required|integer|min:10',
            'question_number' => 'required|integer|min:1',
            'digits' => 'required|json',
            'operators' => 'required|json',
            'formatted_question' => 'required|string',
            'answer' => 'required|numeric',
            'time_limit' => 'nullable|integer|min:1',
            'difficulty' => 'nullable|integer|min:1|max:5',
        ]);
        
        if ($validator->fails()) {
            return [
                'status' => 'skipped',
                'message' => implode(', ', $validator->errors()->all())
            ];
        }
        
        // Get level
        $level = Level::where('slug', $row['level_slug'])->first();
        if (!$level) {
            return [
                'status' => 'skipped',
                'message' => "Level not found: {$row['level_slug']}"
            ];
        }
        
        // Get or create week
        $week = Week::firstOrCreate(
            [
                'level_id' => $level->id,
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
            return [
                'status' => 'skipped',
                'message' => "Question type not found: {$row['question_type_name']}"
            ];
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
                'total_questions' => 0,
                'difficulty' => $row['difficulty'] ?? 1,
                'time_limit' => $row['time_limit'] ?? null,
                'is_active' => true,
            ]
        );
        
        // Check if question already exists
        $existing = Question::where('question_set_id', $questionSet->id)
            ->where('question_number', $row['question_number'])
            ->first();
        
        if ($existing) {
            if (!$dryRun) {
                $existing->update([
                    'digits' => json_decode($row['digits'], true),
                    'operators' => json_decode($row['operators'], true),
                    'formatted_question' => $row['formatted_question'],
                    'answer' => $row['answer'],
                    'time_limit' => $row['time_limit'] ?? null,
                    'question_type_id' => $questionType->id,
                ]);
            }
            return ['status' => 'updated', 'message' => 'Question updated'];
        } else {
            if (!$dryRun) {
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
                
                // Update question set count
                $questionSet->update([
                    'total_questions' => Question::where('question_set_id', $questionSet->id)->count()
                ]);
                
                // Update week count
                $week->update([
                    'total_sets' => QuestionSet::where('week_id', $week->id)->count()
                ]);
            }
            return ['status' => 'imported', 'message' => 'Question imported'];
        }
    }
    
    // New method to generate CSV for specific level/week
    public function generateExportForLevelWeek(string $levelSlug, int $weekNumber): string
    {
        return $this->exportQuestions($levelSlug, $weekNumber);
    }
    
    // Method to get all levels for dropdown
    public function getLevelsForDropdown(): array
    {
        return Level::orderBy('order')
            ->get(['id', 'name', 'slug'])
            ->mapWithKeys(function ($level) {
                return [$level->slug => $level->name];
            })
            ->toArray();
    }
}


// namespace App\Services;

// use App\Models\Question;
// use App\Models\QuestionSet;
// use App\Models\Week;
// use App\Models\QuestionType;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Validator;
// use League\Csv\Reader;
// use League\Csv\Writer;
// use Illuminate\Support\Facades\Storage;

// class QuestionBulkService
// {
//     public function generateTemplate(bool $withSamples = false): string
//     {
//         $csv = Writer::createFromString('');
        
//         $headers = [
//             'week_number',
//             'week_type',
//             'week_title',
//             'set_name',
//             'set_number',
//             'question_type_name',
//             'question_number',
//             'digits',
//             'operators',
//             'formatted_question',
//             'answer',
//             'time_limit'
//         ];
        
//         $csv->insertOne($headers);
        
//         if ($withSamples) {
//             $samples = [
//                 [1, 'regular', '1st Week', 'Set 1', 10, 'Addition/Subtraction', 1, '[3,4]', '["+"]', '3 + 4', 7, 30],
//                 [1, 'regular', '1st Week', 'Set 1', 10, 'Addition/Subtraction', 2, '[5,2]', '["-"]', '5 - 2', 3, 30],
//                 [2, 'multiplication', '2nd Week', 'Set 1', 10, 'Multiplication', 1, '[5,6]', '["*"]', '5 × 6', 30, 30],
//             ];
//             $csv->insertAll($samples);
//         }
        
//         return $csv->toString();
//     }
    
//     public function exportQuestions($weeks = null): string
//     {
//         $csv = Writer::createFromString('');
        
//         $headers = [
//             'week_number',
//             'week_type',
//             'week_title',
//             'set_name',
//             'set_number',
//             'question_type_name',
//             'question_number',
//             'digits',
//             'operators',
//             'formatted_question',
//             'answer',
//             'time_limit'
//         ];
        
//         $csv->insertOne($headers);
        
//         $query = Question::with(['questionSet.week', 'questionType'])
//             ->orderBy('question_set_id')
//             ->orderBy('question_number');
            
//         if ($weeks) {
//             $query->whereHas('questionSet.week', function($q) use ($weeks) {
//                 $q->whereIn('id', (array)$weeks);
//             });
//         }
        
//         $questions = $query->get();
        
//         foreach ($questions as $question) {
//             $csv->insertOne([
//                 $question->questionSet->week->week_number,
//                 $question->questionSet->week->week_type,
//                 $question->questionSet->week->title,
//                 $question->questionSet->name,
//                 $question->questionSet->set_number,
//                 $question->questionType->name,
//                 $question->question_number,
//                 json_encode($question->digits),
//                 json_encode($question->operators),
//                 $question->formatted_question,
//                 $question->answer,
//                 $question->time_limit
//             ]);
//         }
        
//         return $csv->toString();
//     }
    
//     public function importFromCsv(string $content, int $levelId, bool $dryRun = false): array
//     {
//         try {
//             $csv = Reader::createFromString($content);
//             $csv->setHeaderOffset(0);
//         } catch (\Exception $e) {
//             return [
//                 'imported' => 0,
//                 'updated' => 0,
//                 'skipped' => 0,
//                 'errors' => ['Invalid CSV format: ' . $e->getMessage()]
//             ];
//         }
        
//         $results = [
//             'imported' => 0,
//             'updated' => 0,
//             'skipped' => 0,
//             'errors' => []
//         ];
        
//         DB::beginTransaction();
        
//         try {
//             $headers = $csv->getHeader();
//             $requiredHeaders = [
//                 'week_number', 'week_type', 'week_title', 'set_name',
//                 'set_number', 'question_type_name', 'question_number',
//                 'digits', 'operators', 'formatted_question', 'answer'
//             ];
            
//             // Check headers
//             foreach ($requiredHeaders as $required) {
//                 if (!in_array($required, $headers)) {
//                     DB::rollBack();
//                     return [
//                         'imported' => 0,
//                         'updated' => 0,
//                         'skipped' => 0,
//                         'errors' => ["Missing required column: {$required}. Available columns: " . implode(', ', $headers)]
//                     ];
//                 }
//             }
            
//             foreach ($csv as $index => $row) {
//                 $rowNumber = $index + 2;
                
//                 try {
//                     $result = $this->importRow($row, $levelId, $dryRun);
                    
//                     if ($result['status'] === 'imported') {
//                         $results['imported']++;
//                     } elseif ($result['status'] === 'updated') {
//                         $results['updated']++;
//                     } else {
//                         $results['skipped']++;
//                         $results['errors'][] = "Row {$rowNumber}: {$result['message']}";
//                     }
//                 } catch (\Exception $e) {
//                     $results['skipped']++;
//                     $results['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
//                 }
//             }
            
//             if (!$dryRun && empty($results['errors'])) {
//                 DB::commit();
//             } else {
//                 DB::rollBack();
//             }
            
//             return $results;
            
//         } catch (\Exception $e) {
//             DB::rollBack();
//             return [
//                 'imported' => 0,
//                 'updated' => 0,
//                 'skipped' => 0,
//                 'errors' => ['System error: ' . $e->getMessage()]
//             ];
//         }
//     }
    
//     private function importRow(array $row, int $levelId, bool $dryRun): array
//     {
//         // Validation
//         $validator = Validator::make($row, [
//             'week_number' => 'required|integer|min:1',
//             'week_type' => 'required|in:regular,multiplication',
//             'week_title' => 'required|string',
//             'set_name' => 'required|string',
//             'set_number' => 'required|integer|min:10',
//             'question_type_name' => 'required|string',
//             'question_number' => 'required|integer|min:1',
//             'digits' => 'required|json',
//             'operators' => 'required|json',
//             'formatted_question' => 'required|string',
//             'answer' => 'required|numeric',
//             'time_limit' => 'nullable|integer|min:1',
//         ]);
        
//         if ($validator->fails()) {
//             return [
//                 'status' => 'skipped',
//                 'message' => implode(', ', $validator->errors()->all())
//             ];
//         }
        
//         // Get or create week
//         $week = Week::firstOrCreate(
//             [
//                 'level_id' => $levelId,
//                 'week_number' => $row['week_number'],
//             ],
//             [
//                 'week_type' => $row['week_type'],
//                 'title' => $row['week_title'],
//                 'is_active' => true,
//             ]
//         );
        
//         // Get question type
//         $questionType = QuestionType::where('name', $row['question_type_name'])->first();
//         if (!$questionType) {
//             return [
//                 'status' => 'skipped',
//                 'message' => "Question type not found: {$row['question_type_name']}"
//             ];
//         }
        
//         // Get or create question set
//         $questionSet = QuestionSet::firstOrCreate(
//             [
//                 'week_id' => $week->id,
//                 'question_type_id' => $questionType->id,
//                 'set_number' => $row['set_number'],
//             ],
//             [
//                 'name' => $row['set_name'],
//                 'total_questions' => 0,
//                 'difficulty' => 1,
//                 'is_active' => true,
//             ]
//         );
        
//         // Check if exists
//         $existing = Question::where('question_set_id', $questionSet->id)
//             ->where('question_number', $row['question_number'])
//             ->first();
        
//         if ($existing) {
//             if (!$dryRun) {
//                 $existing->update([
//                     'digits' => json_decode($row['digits'], true),
//                     'operators' => json_decode($row['operators'], true),
//                     'formatted_question' => $row['formatted_question'],
//                     'answer' => $row['answer'],
//                     'time_limit' => $row['time_limit'] ?? null,
//                     'question_type_id' => $questionType->id,
//                 ]);
//             }
//             return ['status' => 'updated', 'message' => 'Question updated'];
//         } else {
//             if (!$dryRun) {
//                 Question::create([
//                     'question_set_id' => $questionSet->id,
//                     'question_type_id' => $questionType->id,
//                     'question_number' => $row['question_number'],
//                     'digits' => json_decode($row['digits'], true),
//                     'operators' => json_decode($row['operators'], true),
//                     'formatted_question' => $row['formatted_question'],
//                     'answer' => $row['answer'],
//                     'time_limit' => $row['time_limit'] ?? null,
//                     'is_auto_generated' => false,
//                 ]);
                
//                 // Update counts
//                 $questionSet->update([
//                     'total_questions' => Question::where('question_set_id', $questionSet->id)->count()
//                 ]);
                
//                 $week->update([
//                     'total_sets' => QuestionSet::where('week_id', $week->id)->count()
//                 ]);
//             }
//             return ['status' => 'imported', 'message' => 'Question imported'];
//         }
//     }
// }