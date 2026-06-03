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
        // Update Roles table
        Schema::table('roles', function (Blueprint $table) {
            if (!Schema::hasColumn('roles', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('roles', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('parent_id');
            }
        });

        // Update Attendance Legends table
        Schema::table('attendance_legends', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_legends', 'total_leaves')) {
                $table->integer('total_leaves')->default(0)->after('treat_as');
            }
            if (!Schema::hasColumn('attendance_legends', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('total_leaves');
            }
        });

        // New Table: Attendance Settings
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->time('default_in_time')->nullable();
            $table->time('default_out_time')->nullable();
            $table->boolean('mark_attendance_on_weekend')->default(false);
            $table->timestamps();
        });

        // New Table: Calling Reasons
        Schema::create('calling_reasons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // New Table: Staff Document Types
        Schema::create('staff_document_types', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
