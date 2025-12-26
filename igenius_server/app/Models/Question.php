<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Question extends Model
{
    protected $fillable = [
        'question_set_id', 'question_type_id', 'question_number',
        'digits', 'operators', 'formatted_question',
        'answer', 'time_limit', 'is_auto_generated'
    ];
    
    protected $casts = [
        'digits' => 'array',
        'operators' => 'array',
        'is_auto_generated' => 'boolean',
    ];
    
    protected $appends = ['operation_types', 'display_question'];
    
    public function questionSet(): BelongsTo
    {
        return $this->belongsTo(QuestionSet::class);
    }
    
    public function questionType(): BelongsTo
    {
        return $this->belongsTo(QuestionType::class);
    }

    public function examAnswers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class);
    }

    // Automatically format question when digits/operators are set
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($question) {
            if (empty($question->formatted_question)) {
                $question->formatted_question = $question->getFormattedQuestion();
            }
            
            // Ensure digits and operators are properly formatted
            $question->formatDigitsAndOperators();
        });
    }

    // Format digits and operators from Filament repeater structure
    public function formatDigitsAndOperators(): void
    {
        $digits = $this->digits;
        $operators = $this->operators;
        
        // If digits is an array of arrays (from repeater), flatten it
        if (is_array($digits) && count($digits) > 0 && is_array($digits[0])) {
            $this->digits = array_column($digits, 'digit');
        }
        
        // If operators is an array of arrays (from repeater), flatten it
        if (is_array($operators) && count($operators) > 0 && is_array($operators[0])) {
            $this->operators = array_column($operators, 'operator');
        }
    }

    // Calculate answer from digits and operators
    public function calculateAnswer(): float
    {
        // Ensure digits and operators are properly formatted first
        $this->formatDigitsAndOperators();
        
        $digits = $this->digits;
        $operators = $this->operators;
        
        if (empty($digits)) {
            return 0;
        }
        
        // Ensure digits are numeric
        $digits = array_map(function($digit) {
            return is_numeric($digit) ? (float)$digit : 0;
        }, $digits);
        
        // Start with first digit
        $result = $digits[0];
        
        // Apply operations in order
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
        
        return round($result, 2);
    }

    // Get formatted question string
    public function getFormattedQuestion(): string
    {
        // Ensure digits and operators are properly formatted first
        $this->formatDigitsAndOperators();
        
        $question = '';
        $digits = $this->digits ?? [];
        $operators = $this->operators ?? [];
        
        // Ensure digits are flattened
        $digits = array_map(function($digit) {
            return is_array($digit) ? ($digit['digit'] ?? 0) : $digit;
        }, $digits);
        
        foreach ($digits as $index => $digit) {
            $question .= (string)$digit;
            if (isset($operators[$index])) {
                // Handle operator if it's in array format
                $operator = is_array($operators[$index]) ? 
                    ($operators[$index]['operator'] ?? '+') : 
                    $operators[$index];
                
                // Use symbols for display
                $displayOperator = match($operator) {
                    '*' => '×',
                    '/' => '÷',
                    default => $operator
                };
                $question .= ' ' . $displayOperator . ' ';
            }
        }
        
        return trim($question);
    }

    // Operation types attribute
    protected function operationTypes(): Attribute
    {
        return Attribute::make(
            get: function () {
                $this->formatDigitsAndOperators();
                $operators = $this->operators ?? [];
                $types = [];
                
                if (in_array('+', $operators)) {
                    $types[] = 'Addition';
                }
                if (in_array('-', $operators)) {
                    $types[] = 'Subtraction';
                }
                if (in_array('*', $operators)) {
                    $types[] = 'Multiplication';
                }
                if (in_array('/', $operators)) {
                    $types[] = 'Division';
                }
                
                return array_unique($types);
            }
        );
    }

    // Display question attribute
    protected function displayQuestion(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->formatted_question ?? $this->getFormattedQuestion()
        );
    }

    // Helper to get digits as simple array
    public function getDigitsArray(): array
    {
        $this->formatDigitsAndOperators();
        return $this->digits ?? [];
    }

    // Helper to get operators as simple array
    public function getOperatorsArray(): array
    {
        $this->formatDigitsAndOperators();
        return $this->operators ?? [];
    }

    // Helper method to create question with digits and operators
    public static function createFromExpression(array $digits, array $operators): self
    {
        $question = new self();
        $question->digits = $digits;
        $question->operators = $operators;
        $question->formatDigitsAndOperators();
        $question->formatted_question = $question->getFormattedQuestion();
        $question->answer = $question->calculateAnswer();
        
        return $question;
    }
}