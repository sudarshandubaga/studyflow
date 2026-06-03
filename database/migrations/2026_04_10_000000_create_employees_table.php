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
        if (!Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('title_id')->nullable()->constrained('titles')->nullOnDelete();
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->enum('gender', ['Male', 'Female', 'Other'])->nullable();
                $table->date('dob')->nullable();
                $table->date('doj')->nullable();
                $table->enum('employee_type', ['Teaching Staff', 'Non-Teaching Staff', 'Management'])->nullable();
                $table->string('attendance_code')->nullable();
                $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();
                $table->foreignId('state_id')->nullable()->constrained('states')->nullOnDelete();
                $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Seed roles if they don't exist
        $roles = ['owner', 'admin', 'teacher', 'parent', 'staff'];
        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Add sub-roles for staff
        $staffRole = \App\Models\Role::where('name', 'staff')->first();
        if ($staffRole) {
            $subRoles = ['Accountant', 'Librarian', 'Receptionist', 'Driver', 'Cleaner'];
            foreach ($subRoles as $subRole) {
                \App\Models\Role::updateOrCreate(
                    ['name' => $subRole, 'guard_name' => 'web'],
                    ['parent_id' => $staffRole->id]
                );
            }
        }

        // Migrate existing data from users to employees for users with role 'staff' or 'teacher' or 'admin' 
        // who have employee-like fields filled.
        $users = \App\Models\User::whereNotNull('first_name')->get();
        foreach ($users as $user) {
            \DB::table('employees')->insert([
                'user_id' => $user->id,
                'title_id' => $user->title_id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'gender' => $user->gender,
                'dob' => $user->dob,
                'doj' => $user->doj,
                'employee_type' => $user->employee_type,
                'attendance_code' => $user->attendance_code,
                'country_id' => $user->country_id,
                'state_id' => $user->state_id,
                'city_id' => $user->city_id,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);

            // Migrate custom field values from User to Employee
            \DB::table('custom_field_values')
                ->where('customable_type', 'App\Models\User')
                ->where('customable_id', $user->id)
                ->update([
                    'customable_type' => 'App\Models\Employee',
                    'customable_id' => \DB::table('employees')->where('user_id', $user->id)->value('id')
                ]);
        }

        // Drop columns from users table
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'country_id')) {
                $table->dropForeign(['country_id']);
                $table->dropColumn('country_id');
            }
            if (Schema::hasColumn('users', 'state_id')) {
                $table->dropForeign(['state_id']);
                $table->dropColumn('state_id');
            }
            if (Schema::hasColumn('users', 'city_id')) {
                $table->dropForeign(['city_id']);
                $table->dropColumn('city_id');
            }

            $columnsToDrop = [
                'title_id', 'first_name', 'middle_name', 'last_name',
                'gender', 'dob', 'doj', 'employee_type', 'attendance_code'
            ];
            
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('title_id')->nullable()->after('id');
            $table->string('first_name')->nullable()->after('title_id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('username');
            $table->date('dob')->nullable()->after('gender');
            $table->date('doj')->nullable()->after('dob');
            $table->enum('employee_type', ['Teaching Staff', 'Non-Teaching Staff', 'Management'])->nullable()->after('doj');
            $table->string('attendance_code')->nullable()->after('employee_type');
            $table->foreignId('country_id')->nullable()->constrained('countries')->onDelete('set null')->after('attendance_code');
            $table->foreignId('state_id')->nullable()->constrained('states')->onDelete('set null')->after('country_id');
            $table->foreignId('city_id')->nullable()->constrained('cities')->onDelete('set null')->after('state_id');
        });

        // Restore data from employees to users
        $employees = \DB::table('employees')->get();
        foreach ($employees as $employee) {
            \App\Models\User::where('id', $employee->user_id)->update([
                'title_id' => $employee->title_id,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
                'gender' => $employee->gender,
                'dob' => $employee->dob,
                'doj' => $employee->doj,
                'employee_type' => $employee->employee_type,
                'attendance_code' => $employee->attendance_code,
                'country_id' => $employee->country_id,
                'state_id' => $employee->state_id,
                'city_id' => $employee->city_id,
            ]);
        }

        Schema::dropIfExists('employees');
    }
};
