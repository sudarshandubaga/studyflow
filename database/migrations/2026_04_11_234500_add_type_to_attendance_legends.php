<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendance_legends', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_legends', 'type')) {
                $table->enum('type', ['Employee', 'Student'])->default('Employee')->after('short_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendance_legends', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
