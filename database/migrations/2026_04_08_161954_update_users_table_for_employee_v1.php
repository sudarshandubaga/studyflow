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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('title_id')->nullable()->after('id');
            $table->string('first_name')->nullable()->after('title_id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->string('username')->unique()->nullable()->after('email');
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('username');
            $table->date('dob')->nullable()->after('gender');
            $table->date('doj')->nullable()->after('dob');
            $table->enum('employee_type', ['Teaching Staff', 'Non-Teaching Staff', 'Management'])->nullable()->after('doj');
            $table->string('attendance_code')->nullable()->after('employee_type');
            $table->foreignId('country_id')->nullable()->constrained('countries')->onDelete('set null')->after('attendance_code');
            $table->foreignId('state_id')->nullable()->constrained('states')->onDelete('set null')->after('country_id');
            $table->foreignId('city_id')->nullable()->constrained('cities')->onDelete('set null')->after('state_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropForeign(['state_id']);
            $table->dropForeign(['city_id']);
            $table->dropColumn([
                'title_id',
                'first_name',
                'middle_name',
                'last_name',
                'username',
                'gender',
                'dob',
                'doj',
                'employee_type',
                'attendance_code',
                'country_id',
                'state_id',
                'city_id'
            ]);
        });
    }
};
