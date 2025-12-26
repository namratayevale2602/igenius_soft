<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use App\Models\BulkWeekImport;

Route::get('/admin/bulk-week-imports/{import}/download-errors', function ($import) {
    $import = BulkWeekImport::findOrFail($import);
    
    if (!$import->errors) {
        abort(404, 'No errors found for this import');
    }
    
    $errors = json_decode($import->errors, true);
    $csvContent = "Row,Set,Question Number,Error\n";
    
    foreach ($errors as $error) {
        $csvContent .= "{$error['row']},{$error['set']},{$error['question_number']},{$error['error']}\n";
    }
    
    return response()->streamDownload(function () use ($csvContent) {
        echo $csvContent;
    }, "errors_import_{$import->id}.csv");
})->name('filament.admin.resources.bulk-week-imports.download-errors');

Route::get('/download/week-import-template', function () {
    $filePath = storage_path('app/templates/week_import_template.csv');
    
    if (!file_exists($filePath)) {
        // Generate template
        $csvContent = "question_set,question_number,digit_1,digit_2,digit_3,digit_4,digit_5,operator_1,operator_2,operator_3,operator_4,time_limit,answer\n";
        $csvContent .= "1,1,6,8,4,,,+,-,,,10,10\n";
        $csvContent .= "1,2,12,3,5,,,*,+,10,41\n";
        $csvContent .= "1,3,45,23,9,,,-,+,10,31\n";
        
        Storage::disk('local')->put('templates/week_import_template.csv', $csvContent);
    }
    
    return response()->download($filePath, 'week_import_template.csv');
})->name('download.week-import-template');