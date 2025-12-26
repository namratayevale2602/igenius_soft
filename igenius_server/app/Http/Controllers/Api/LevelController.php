<?php
// app/Http/Controllers/Api/LevelController.php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Level;
use App\Models\Week;
use App\Models\QuestionSet;
use Illuminate\Http\Request;

class LevelController extends Controller
{
    // Get all levels
    public function index()
    {
        $levels = Level::where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'order', 'description']);
        
        return response()->json([
            'success' => true,
            'data' => $levels
        ]);
    }
    
    // Get a specific level with its weeks
    public function show($slug)
    {
        $level = Level::where('slug', $slug)
            ->where('is_active', true)
            ->with(['weeks' => function($query) {
                $query->where('is_active', true)
                      ->orderBy('week_number')
                      ->select(['id', 'level_id', 'week_number', 'title', 'total_sets']);
            }])
            ->firstOrFail();
        
        return response()->json([
            'success' => true,
            'data' => $level
        ]);
    }
    
    // Get weeks for a specific level
    public function getWeeks($slug)
    {
        $level = Level::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
        
        $weeks = $level->weeks()
            ->where('is_active', true)
            ->orderBy('week_number')
            ->get(['id', 'week_number', 'title', 'total_sets']);
        
        return response()->json([
            'success' => true,
            'data' => [
                'level' => $level->only(['id', 'name', 'slug']),
                'weeks' => $weeks
            ]
        ]);
    }
    
    // Get question sets for a specific week (with level validation)
    public function getWeekQuestionSets($levelSlug, $weekNumber)
    {
        // First, get the level
        $level = Level::where('slug', $levelSlug)
            ->where('is_active', true)
            ->firstOrFail();
        
        // Get the week for this specific level
        $week = Week::where('level_id', $level->id)
            ->where('week_number', $weekNumber)
            ->where('is_active', true)
            ->firstOrFail();
        
        // Get question sets for this week
        $questionSets = $week->questionSets()
            ->with(['questionType' => function($query) {
                $query->select(['id', 'name', 'slug', 'icon']);
            }])
            ->orderBy('set_number')
            ->get(['id', 'week_id', 'question_type_id', 'name', 'set_number', 'total_questions', 'time_limit', 'difficulty']);
        
        // Group by question type for frontend display
        $groupedSets = $questionSets->groupBy('questionType.slug')->map(function($sets, $typeSlug) {
            return [
                'type' => $sets->first()->questionType,
                'sets' => $sets->sortBy('set_number')->values()
            ];
        })->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'level' => $level->only(['id', 'name', 'slug']),
                'week' => $week->only(['id', 'week_number', 'title']),
                'question_sets' => $groupedSets
            ]
        ]);
    }
    
    // Get all questions for a question set (with validation)
    // Get all questions for a question set (with validation)
public function getQuestionSetQuestions($levelSlug, $weekNumber, $questionSetId)
{
    // Validate the chain: Level → Week → QuestionSet
    $level = Level::where('slug', $levelSlug)
        ->where('is_active', true)
        ->firstOrFail();
    
    $week = Week::where('level_id', $level->id)
        ->where('week_number', $weekNumber)
        ->where('is_active', true)
        ->firstOrFail();
    
    $questionSet = QuestionSet::where('week_id', $week->id)
        ->where('id', $questionSetId)
        ->where('is_active', true)
        ->with(['questionType', 'questions' => function($query) {
            $query->orderBy('question_number');
        }])
        ->firstOrFail();
    
    // Format questions with simplified structure for sequential display
    $questions = $questionSet->questions->map(function($question) use ($questionSet) {
        // Get digits and operators as simple arrays
        $digits = $question->digits ?? [];
        $operators = $question->operators ?? [];
        
        // Flatten arrays if they're from repeater format
        if (is_array($digits) && count($digits) > 0 && is_array($digits[0] ?? null)) {
            $digits = array_column($digits, 'digit');
        }
        
        if (is_array($operators) && count($operators) > 0 && is_array($operators[0] ?? null)) {
            $operators = array_column($operators, 'operator');
        }
        
        // Build display sequence
        $displaySequence = [];
        
        // Add all digits and operators in order
        for ($i = 0; $i < count($digits); $i++) {
            // Add digit
            $displaySequence[] = [
                'type' => 'digit',
                'value' => $digits[$i],
                'display' => (string)$digits[$i],
                'position' => $i + 1,
                'level' => $i * 2 + 1
            ];
            
            // Add operator after digit (except after last digit)
            if ($i < count($digits) - 1 && isset($operators[$i])) {
                $displayOperator = match($operators[$i]) {
                    '*' => '×',
                    '/' => '÷',
                    default => $operators[$i]
                };
                
                $displaySequence[] = [
                    'type' => 'operator',
                    'value' => $operators[$i],
                    'display' => $displayOperator,
                    'position' => $i + 1,
                    'level' => $i * 2 + 2
                ];
            }
        }
        
        // Add equals sign at the end
        $displaySequence[] = [
            'type' => 'equals',
            'value' => '=',
            'display' => '=',
            'position' => count($digits),
            'level' => count($digits) * 2
        ];
        
        return [
            'id' => $question->id,
            'question_number' => $question->question_number,
            'display_sequence' => $displaySequence,
            'answer' => round($question->answer, 2),
            'formatted_question' => $question->formatted_question ?? $question->getFormattedQuestion(),
            'time_limit' => $question->time_limit ?? $questionSet->time_limit ?? 10,
            'metadata' => [
                'difficulty' => $question->difficulty ?? 1,
                'is_auto_generated' => $question->is_auto_generated ?? false,
                'created_at' => $question->created_at,
                'updated_at' => $question->updated_at
            ]
        ];
    });
    
    return response()->json([
        'success' => true,
        'data' => [
            'level' => [
                'id' => $level->id,
                'name' => $level->name,
                'slug' => $level->slug,
                'order' => $level->order,
                'description' => $level->description
            ],
            'week' => [
                'id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'week_type' => $week->week_type,
                'total_sets' => $week->total_sets
            ],
            'question_set' => [
                'id' => $questionSet->id,
                'name' => $questionSet->name,
                'set_number' => $questionSet->set_number,
                'total_questions' => $questionSet->total_questions,
                'default_time_limit' => $questionSet->time_limit,
                'difficulty' => $questionSet->difficulty,
                'question_type' => [
                    'id' => $questionSet->questionType->id,
                    'name' => $questionSet->questionType->name,
                    'slug' => $questionSet->questionType->slug,
                    'icon' => $questionSet->questionType->icon
                ]
            ],
            'questions' => $questions,
            'practice_settings' => [
                'pause_between_questions' => 2, // 2 seconds pause between questions
                'auto_progression' => true,
                'show_answers_at_end' => true
            ]
        ]
    ]);
}

// app/Http/Controllers/Api/LevelController.php
// Add this method to handle multiple question sets

public function getMultipleQuestionSets(Request $request, $levelSlug, $weekNumber)
{
    $setIds = $request->input('set_ids', []);
    
    if (empty($setIds)) {
        return response()->json([
            'success' => false,
            'message' => 'No question set IDs provided'
        ], 400);
    }
    
    // First, get the level
    $level = Level::where('slug', $levelSlug)
        ->where('is_active', true)
        ->firstOrFail();
    
    // Get the week for this specific level
    $week = Week::where('level_id', $level->id)
        ->where('week_number', $weekNumber)
        ->where('is_active', true)
        ->firstOrFail();
    
    $allQuestions = [];
    $questionSets = [];
    
    foreach ($setIds as $setId) {
        $questionSet = QuestionSet::where('week_id', $week->id)
            ->where('id', $setId)
            ->where('is_active', true)
            ->with(['questionType', 'questions' => function($query) {
                $query->orderBy('question_number');
            }])
            ->first();
        
        if ($questionSet) {
            $questionSets[] = [
                'id' => $questionSet->id,
                'name' => $questionSet->name,
                'set_number' => $questionSet->set_number,
                'total_questions' => $questionSet->total_questions,
                'time_limit' => $questionSet->time_limit,
                'difficulty' => $questionSet->difficulty,
                'question_type' => [
                    'id' => $questionSet->questionType->id,
                    'name' => $questionSet->questionType->name,
                    'slug' => $questionSet->questionType->slug,
                    'icon' => $questionSet->questionType->icon
                ]
            ];
            
            foreach ($questionSet->questions as $question) {
                $allQuestions[] = $this->formatQuestion($question, $questionSet);
            }
        }
    }
    
    return response()->json([
        'success' => true,
        'data' => [
            'level' => $level->only(['id', 'name', 'slug']),
            'week' => $week->only(['id', 'week_number', 'title']),
            'question_sets' => $questionSets,
            'questions' => $allQuestions,
            'practice_settings' => [
                'pause_between_questions' => 2,
                'pause_between_sets' => 2, // 2 seconds pause between sets
                'auto_progression' => true,
                'show_answers_at_end' => true
            ]
        ]
    ]);
}

private function formatQuestion($question, $questionSet)
{
    $digits = $question->digits ?? [];
    $operators = $question->operators ?? [];
    
    if (is_array($digits) && count($digits) > 0 && is_array($digits[0] ?? null)) {
        $digits = array_column($digits, 'digit');
    }
    
    if (is_array($operators) && count($operators) > 0 && is_array($operators[0] ?? null)) {
        $operators = array_column($operators, 'operator');
    }
    
    $displaySequence = [];
    
    for ($i = 0; $i < count($digits); $i++) {
        $displaySequence[] = [
            'type' => 'digit',
            'value' => $digits[$i],
            'display' => (string)$digits[$i],
            'position' => $i + 1,
            'level' => $i * 2 + 1
        ];
        
        if ($i < count($digits) - 1 && isset($operators[$i])) {
            $displayOperator = match($operators[$i]) {
                '*' => '×',
                '/' => '÷',
                default => $operators[$i]
            };
            
            $displaySequence[] = [
                'type' => 'operator',
                'value' => $operators[$i],
                'display' => $displayOperator,
                'position' => $i + 1,
                'level' => $i * 2 + 2
            ];
        }
    }
    
    $displaySequence[] = [
        'type' => 'equals',
        'value' => '=',
        'display' => '=',
        'position' => count($digits),
        'level' => count($digits) * 2
    ];
    
    return [
        'id' => $question->id,
        'set_id' => $questionSet->id, // Add set identifier
        'question_number' => $question->question_number,
        'display_sequence' => $displaySequence,
        'answer' => round($question->answer, 2),
        'formatted_question' => $question->formatted_question ?? $question->getFormattedQuestion(),
        'time_limit' => $question->time_limit ?? $questionSet->time_limit ?? 10,
        'metadata' => [
            'difficulty' => $question->difficulty ?? 1,
            'is_auto_generated' => $question->is_auto_generated ?? false,
            'created_at' => $question->created_at,
            'updated_at' => $question->updated_at
        ]
    ];
}

}