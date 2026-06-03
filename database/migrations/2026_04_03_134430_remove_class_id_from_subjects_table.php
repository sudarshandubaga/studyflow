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
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropUnique(['name', 'class_id']);
            $table->dropColumn('class_id');
            $table->foreignId('school_branch_id')->after('id')->nullable()->constrained('school_branches')->onDelete('cascade');
            $table->unique(['name', 'school_branch_id']);
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropUnique(['name', 'school_branch_id']);
            $table->dropColumn('school_branch_id');
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->unique(['name', 'class_id']);
        });
    }
};
