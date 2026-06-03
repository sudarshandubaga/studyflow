<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attendance_legend_id')->constrained('attendance_legends')->cascadeOnDelete();
            $table->date('date');
            $table->string('remarks')->nullable();
            
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('branch_id');
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            
            $table->unique(['student_id', 'date'], 'idx_student_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_attendances');
    }
};
