<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_set_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_type_id')->constrained();
            $table->integer('question_number');
            
            // Store digits as JSON array
            $table->json('digits'); // e.g., [3, 4, 5] for 3x4+5
            
            // Store operators as JSON array
            $table->json('operators'); // e.g., ['*', '+'] for between digits
            
            // Store for display purposes
            $table->string('formatted_question')->nullable(); // e.g., "3 x 4 + 5"
            
            $table->decimal('answer', 10, 2);
            $table->integer('time_limit')->nullable();
            $table->boolean('is_auto_generated')->default(false);
            $table->timestamps();
            
            $table->unique(['question_set_id', 'question_number']);
            $table->index(['question_set_id', 'question_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};