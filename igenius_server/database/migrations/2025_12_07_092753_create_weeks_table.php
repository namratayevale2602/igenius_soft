<?php
// database/migrations/xxxx_create_weeks_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->constrained()->onDelete('cascade');
            $table->integer('week_number'); // 1-10
            $table->enum('week_type', ['regular', 'multiplication'])->default('regular');
            $table->string('title'); // '1st Week', '2nd Week'
            $table->integer('total_sets')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
              
        
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weeks');
    }
};