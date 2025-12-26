<?php
// app/Models/Level.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = ['name', 'slug', 'order', 'description', 'is_active'];
    
    // Get only active weeks
    public function weeks(): HasMany
    {
        return $this->hasMany(Week::class)->where('is_active', true)->orderBy('week_number');
    }
    
    // Get all weeks (including inactive)
    public function allWeeks(): HasMany
    {
        return $this->hasMany(Week::class)->orderBy('week_number');
    }
    
    // Get total weeks count
    public function getTotalWeeksAttribute(): int
    {
        return $this->weeks()->count();
    }
}