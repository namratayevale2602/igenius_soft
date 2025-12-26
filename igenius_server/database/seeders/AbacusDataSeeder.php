<?php
// database/seeders/AbacusDataSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Level;
use App\Models\Week;
use App\Models\QuestionType;
use App\Models\QuestionSet;
use App\Models\Question;

class AbacusDataSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data in reverse order
        Question::query()->delete();
        QuestionSet::query()->delete();
        Week::query()->delete();
        Level::query()->delete();
        QuestionType::query()->delete();
        
        echo "Starting Abacus data seeding...\n";
        
        // 1. Create Question Types (same for all levels)
        $questionTypes = [
            ['name' => 'Addition/Subtraction', 'slug' => 'addition-subtraction', 'icon' => '➕➖'],
            ['name' => 'Multiplication', 'slug' => 'multiplication', 'icon' => '✖️'],
            ['name' => 'Division', 'slug' => 'division', 'icon' => '➗'],
        ];
        
        foreach ($questionTypes as $type) {
            QuestionType::create($type);
        }
        
        echo "Created question types\n";
        
        // 2. Create Levels
        $levels = [
            ['name' => '2nd Level', 'slug' => 'second-level', 'order' => 1, 'description' => 'Second level abacus practice'],
            ['name' => '3rd Level', 'slug' => 'third-level', 'order' => 2, 'description' => 'Third level abacus practice'],
            ['name' => '4th Level', 'slug' => 'fourth-level', 'order' => 3, 'description' => 'Fourth level abacus practice'],
        ];
        
        foreach ($levels as $levelData) {
            Level::create($levelData);
        }
        
        echo "Created levels\n";
        
        // 3. Create weeks for EACH LEVEL SEPARATELY
        $questionTypes = QuestionType::all();
        
        foreach ($levels as $levelIndex => $levelData) {
            $level = Level::where('slug', $levelData['slug'])->first();
            
            echo "\nCreating data for {$level->name}...\n";
            
            // Create 3 weeks for this level
            for ($weekNum = 1; $weekNum <= 3; $weekNum++) {
                $week = Week::create([
                    'level_id' => $level->id,
                    'week_number' => $weekNum,
                    'title' => $this->getWeekTitle($weekNum) . ' Week',
                    'total_sets' => count($questionTypes) * 3, // 3 sets per type
                    'is_active' => true
                ]);
                
                echo "  Week {$weekNum}: ";
                
                // For each question type, create 3 sets (10, 20, 30)
                foreach ($questionTypes as $typeIndex => $type) {
                    for ($setCount = 1; $setCount <= 3; $setCount++) {
                        $setNumber = $setCount * 10; // 10, 20, 30
                        
                        $questionSet = QuestionSet::create([
                            'week_id' => $week->id,
                            'question_type_id' => $type->id,
                            'name' => "Set {$setCount}",
                            'set_number' => $setNumber,
                            'total_questions' => 8, // 10, 20, 30, 40, 50, 60, 70, 80
                            'time_limit' => 180, // 3 minutes
                            'difficulty' => $levelIndex + 1, // Higher level = higher difficulty
                            'is_active' => true
                        ]);
                        
                        // Create 8 questions for this set (10, 20, 30, 40, 50, 60, 70, 80)
                        for ($qNum = 1; $qNum <= 8; $qNum++) {
                            $questionNumber = $qNum * 10; // 10, 20, 30, 40, 50, 60, 70, 80
                            
                            // Generate grid data specific to level and type
                            $grid = [];
                            $answers = array_fill(0, 10, 0);
                            
                            // 5 rows x 10 columns as per your Excel
                            for ($row = 0; $row < 5; $row++) {
                                $grid[$row] = [];
                                for ($col = 0; $col < 10; $col++) {
                                    // Generate level-specific numbers
                                    $value = $this->generateLevelSpecificValue(
                                        $level->slug, 
                                        $type->slug, 
                                        $setCount,
                                        $qNum
                                    );
                                    $grid[$row][$col] = $value;
                                    $answers[$col] += $value;
                                }
                            }
                            
                            Question::create([
                                'question_set_id' => $questionSet->id,
                                'question_number' => $questionNumber,
                                'data' => [
                                    'grid' => $grid,
                                    'columns' => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
                                ],
                                'answers' => $answers,
                                'difficulty' => $this->getQuestionDifficulty($levelIndex, $setCount, $qNum),
                                'time_estimate' => 30 // 30 seconds per question
                            ]);
                        }
                        
                        echo "{$type->slug} ";
                    }
                }
                
                echo "\n";
            }
        }
        
        echo "\n✅ Seeding completed successfully!\n";
        echo "📊 Summary:\n";
        echo "  Levels: " . Level::count() . "\n";
        echo "  Weeks: " . Week::count() . " (" . Week::where('level_id', 1)->count() . " in 2nd Level)\n";
        echo "  Question Sets: " . QuestionSet::count() . "\n";
        echo "  Questions: " . Question::count() . "\n";
        
        // Verify data isolation
        echo "\n🔍 Data Isolation Verification:\n";
        
        foreach (Level::all() as $level) {
            $weekCount = Week::where('level_id', $level->id)->count();
            $setCount = QuestionSet::whereHas('week', function($q) use ($level) {
                $q->where('level_id', $level->id);
            })->count();
            $questionCount = Question::whereHas('questionSet.week', function($q) use ($level) {
                $q->where('level_id', $level->id);
            })->count();
            
            echo "  {$level->name}: {$weekCount} weeks, {$setCount} sets, {$questionCount} questions\n";
        }
    }
    
    private function getWeekTitle($number): string
    {
        $titles = [
            1 => '1st', 2 => '2nd', 3 => '3rd', 4 => '4th', 5 => '5th',
            6 => '6th', 7 => '7th', 8 => '8th', 9 => '9th', 10 => '10th'
        ];
        
        return $titles[$number] ?? $number . 'th';
    }
    
    private function generateLevelSpecificValue($levelSlug, $typeSlug, $setNumber, $questionNumber): int
    {
        // Base ranges for different levels
        $levelRanges = [
            'second-level' => ['min' => -50, 'max' => 100],
            'third-level' => ['min' => -100, 'max' => 200],
            'fourth-level' => ['min' => -150, 'max' => 300]
        ];
        
        $range = $levelRanges[$levelSlug] ?? ['min' => -50, 'max' => 100];
        
        // Adjust based on set and question number (higher numbers = more complex)
        $complexity = ($setNumber / 10) + ($questionNumber / 80);
        
        // Generate number based on type
        switch ($typeSlug) {
            case 'addition-subtraction':
                // Mix of positive and negative
                return rand($range['min'], $range['max']);
                
            case 'multiplication':
                // Smaller positive numbers for multiplication
                return rand(2, 20) * rand(1, 10);
                
            case 'division':
                // Numbers divisible by something
                $divisor = rand(2, 10);
                return $divisor * rand(5, 30);
                
            default:
                return rand($range['min'], $range['max']);
        }
    }
    
    private function getQuestionDifficulty($levelIndex, $setCount, $questionNumber): string
    {
        $baseDifficulty = $levelIndex + 1; // 1, 2, or 3
        
        $total = $baseDifficulty + ($setCount * 0.3) + ($questionNumber / 80);
        
        if ($total <= 2) return 'easy';
        if ($total <= 3.5) return 'medium';
        return 'hard';
    }
}