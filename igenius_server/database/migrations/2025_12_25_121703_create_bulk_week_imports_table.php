<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   
         public function up(): void
    {
        Schema::create('bulk_week_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('week_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_type_id')
                  ->nullable()
                  ->constrained('question_types')
                  ->onDelete('set null');
            $table->string('filename');
            $table->json('import_summary')->nullable(); // Stores summary of imports per set
            $table->integer('total_records')->default(0);
            $table->integer('successful_imports')->default(0);
            $table->integer('failed_imports')->default(0);
            $table->json('errors')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamps();

             // Add index for better performance
            $table->index(['week_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_week_imports');
    }
};
