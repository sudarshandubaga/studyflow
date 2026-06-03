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
        Schema::table('prospectuses', function (Blueprint $table) {
            $table->dropUnique(['form_no', 'session_id']);
            $table->unique(['form_no', 'school_branch_id', 'session_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prospectuses', function (Blueprint $table) {
            $table->dropUnique(['form_no', 'school_branch_id', 'session_id']);
            $table->unique(['form_no', 'session_id']);
        });
    }
};
