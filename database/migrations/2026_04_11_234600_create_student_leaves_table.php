<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attendance_legend_id')->constrained('attendance_legends')->cascadeOnDelete();
            
            $table->date('from_date');
            $table->date('upto_date');
            $table->boolean('is_half_day')->default(false);
            $table->text('reason')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('branch_id');
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_leaves');
    }
};
