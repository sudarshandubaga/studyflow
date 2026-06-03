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
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('like 2025-26');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('is_active', ['active', 'inactive'])->default('inactive');
            $table->foreignId('school_branch_id')->constrained()->cascadeOnDelete();
            $table->softDeletes();
            $table->unique(['name', 'school_branch_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};