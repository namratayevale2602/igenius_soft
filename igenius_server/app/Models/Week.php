<?php
// app/Models/Week.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Week extends Model
{
    protected $fillable = ['level_id', 'week_number', 'title', 'total_sets','week_type', 'is_active'];
    
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
    
    // Get only active question sets
    public function questionSets(): HasMany
    {
        return $this->hasMany(QuestionSet::class)->where('is_active', true)->orderBy('set_number');
    }
    
    // Get all question sets
    public function allQuestionSets(): HasMany
    {
        return $this->hasMany(QuestionSet::class)->orderBy('set_number');
    }
    
    // Get question sets by type
    public function getQuestionSetsByType($typeSlug)
    {
        return $this->questionSets()
            ->whereHas('questionType', function($query) use ($typeSlug) {
                $query->where('slug', $typeSlug);
            })
            ->orderBy('set_number')
            ->get();
    }
    
    // Get available question types for this week
    public function getAvailableQuestionTypesAttribute()
    {
        return $this->questionSets()
            ->with('questionType')
            ->get()
            ->pluck('questionType')
            ->unique('id')
            ->values();
    }
}