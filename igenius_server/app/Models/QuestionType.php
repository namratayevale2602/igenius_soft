<?php
// app/Models/QuestionType.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionType extends Model
{
    protected $fillable = ['name', 'slug', 'icon', 'description', 'is_active'];
    
    public function questionSets(): HasMany
    {
        return $this->hasMany(QuestionSet::class)->where('is_active', true);
    }
}