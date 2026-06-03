<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Move personal identity fields from employees to users table.
     */
    public function up(): void
    {
        // 1. Add personal fields to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'title_id')) {
                $table->unsignedBigInteger('title_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->after('title_id');
            }
            if (!Schema::hasColumn('users', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->after('middle_name');
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('username');
            }
            if (!Schema::hasColumn('users', 'dob')) {
                $table->date('dob')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('users', 'mobile_number')) {
                $table->string('mobile_number')->nullable()->after('phone');
            }
        });

        // 2. Migrate data from employees to users
        $employees = \DB::table('employees')->get();
        foreach ($employees as $employee) {
            \DB::table('users')->where('id', $employee->user_id)->update([
                'title_id' => $employee->title_id,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
                'gender' => $employee->gender,
                'dob' => $employee->dob,
            ]);
        }

        // 3. Drop personal fields from employees table
        Schema::table('employees', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['title_id', 'first_name', 'middle_name', 'last_name', 'gender', 'dob'] as $column) {
                if (Schema::hasColumn('employees', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if (Schema::hasColumn('employees', 'title_id')) {
                try {
                    $table->dropForeign(['title_id']);
                } catch (\Exception $e) {
                    // Foreign key may not exist
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Add personal fields back to employees table
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('title_id')->nullable()->constrained('titles')->nullOnDelete()->after('user_id');
            $table->string('first_name')->after('title_id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->after('middle_name');
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('last_name');
            $table->date('dob')->nullable()->after('gender');
        });

        // 2. Migrate data back from users to employees
        $employees = \DB::table('employees')->get();
        foreach ($employees as $employee) {
            $user = \DB::table('users')->where('id', $employee->user_id)->first();
            if ($user) {
                \DB::table('employees')->where('id', $employee->id)->update([
                    'title_id' => $user->title_id,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'gender' => $user->gender,
                    'dob' => $user->dob,
                ]);
            }
        }

        // 3. Drop personal fields from users table
        Schema::table('users', function (Blueprint $table) {
            $columns = ['title_id', 'first_name', 'middle_name', 'last_name', 'gender', 'dob', 'mobile_number'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
