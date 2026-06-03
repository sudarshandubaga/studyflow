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
        Schema::create('attendance_legends', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_name');
            $table->enum('treat_as', ['present', 'absent'])->default('present');
            $table->foreignId('session_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_legends');
    }
};
