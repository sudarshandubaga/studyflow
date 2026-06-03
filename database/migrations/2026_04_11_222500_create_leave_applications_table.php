<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('school_branches')->nullOnDelete();
            $table->foreignId('session_id')->nullable()->constrained()->nullOnDelete();
            
            // Applicant could be user or student (user_id covers both if students are users, else we use morph or just assume staff for now)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->foreignId('attendance_legend_id')->constrained()->cascadeOnDelete();
            
            $table->date('from_date');
            $table->date('to_date');
            $table->boolean('is_half_day')->default(false);
            $table->text('reason')->nullable();
            
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_applications');
    }
};
