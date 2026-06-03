<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('password');
            $table->enum('role', ['owner', 'admin', 'teacher', 'parent', 'staff'])->default('owner');
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('school_branch_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unique(['email', 'school_id', 'school_branch_id']);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};