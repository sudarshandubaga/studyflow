<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('students');

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            
            // Context
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('branch_id');
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            
            // Personal & Identity
            $table->unsignedBigInteger('title_id')->nullable();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable();
            $table->date('dob')->nullable();
            $table->string('email')->nullable();
            $table->string('mobile_no')->nullable();
            $table->string('photo')->nullable();
            $table->string('password')->nullable(); // For future auth if needed
            
            // Academic 
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_category_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('enrollment_no'); 
            $table->string('roll_no')->nullable();
            $table->date('doj')->nullable();
            
            // Parents / Family
            $table->string('father_email_id')->nullable();
            $table->string('father_mobile_no')->nullable();
            
            // Identity
            $table->string('apaar_id')->nullable();
            $table->string('scholar_id')->nullable();
            
            // Location
            $table->unsignedBigInteger('country_id')->nullable();
            $table->unsignedBigInteger('state_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            
            $table->unique(['enrollment_no', 'school_id', 'session_id']);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
