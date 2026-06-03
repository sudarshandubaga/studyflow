<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('user_id'); // Link to employee (User model)
            $table->unsignedBigInteger('staff_document_type_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->string('file_size')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('staff_document_type_id')->references('id')->on('staff_document_types')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_documents');
    }
};
