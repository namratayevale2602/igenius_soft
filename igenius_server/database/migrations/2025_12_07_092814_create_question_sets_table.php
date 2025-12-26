<?php
// database/migrations/xxxx_create_question_sets_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_type_id')->constrained()->onDelete('cascade');
            $table->string('name'); // 'Set 1', 'Set 2', 'Set 3'
            $table->integer('set_number'); // 10, 20, 30
            $table->integer('total_questions')->default(0);
            $table->integer('time_limit')->nullable(); // in seconds
            $table->integer('difficulty')->default(1); // 1-5
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Each week can only have one set per type with same set number
            $table->unique(['week_id', 'question_type_id', 'set_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_sets');
    }
};