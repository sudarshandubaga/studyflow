<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\SchoolBranch;
use App\Models\Session;
use App\Models\EduClass;
use App\Models\Section;
use App\Models\Employee;
use App\Models\Student;
use App\Models\StudentCategory;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            // 1. Get School/Branch
            $school = School::first();
            $branch = SchoolBranch::first();

            if (!$school || !$branch) {
                $this->command->error('Run SchoolSeeder first!');
                return;
            }

            // 2. Create Session
            $session = Session::updateOrCreate(
                ['name' => '2024-25', 'school_branch_id' => $branch->id],
                ['start_date' => '2024-04-01', 'end_date' => '2025-03-31', 'is_active' => 'active']
            );

            // 3. Create Categories
            $category = StudentCategory::updateOrCreate(
                ['name' => 'General', 'session_id' => $session->id]
            );
            StudentCategory::updateOrCreate(
                ['name' => 'OBC', 'session_id' => $session->id]
            );
            StudentCategory::updateOrCreate(
                ['name' => 'SC/ST', 'session_id' => $session->id]
            );

            // 4. Create Classes & Sections
            $classes = ['Nursery', '1st', '2nd', '3rd', '4th', '5th'];
            foreach ($classes as $className) {
                $class = EduClass::updateOrCreate(
                    ['name' => $className, 'session_id' => $session->id]
                );
                
                Section::updateOrCreate(
                    ['name' => 'A', 'class_id' => $class->id]
                );
                Section::updateOrCreate(
                    ['name' => 'B', 'class_id' => $class->id]
                );
            }

            // 5. Build Employee Roster & Role Allocation
            $employees = Employee::factory()->count(10)->create();
            
            $teacherRole = Role::where('name', 'Teacher')->first();
            $accountantRole = Role::where('name', 'Accountant')->first();
            
            foreach ($employees as $index => $employee) {
                if ($teacherRole && $index < 8) {
                    $employee->user->assignRole($teacherRole);
                } elseif ($accountantRole) {
                    $employee->user->assignRole($accountantRole);
                }
            }

            // 6. Build Student Roster (Assigned to Sections)
            $allSections = Section::all();
            foreach ($allSections as $section) {
                for ($i = 0; $i < 5; $i++) {
                    $student = Student::factory()->create([
                        'school_id' => $school->id,
                        'branch_id' => $branch->id,
                        'session_id' => $session->id,
                        'section_id' => $section->id,
                        'student_category_id' => $category->id
                    ]);

                    // Primary link is in section_id column of students table.
                    // Also populate legacy join table if needed by any modules.
                    if (Schema::hasTable('student_sections')) {
                        DB::table('student_sections')->insert([
                            'student_id' => $student->id,
                            'section_id' => $section->id,
                            // Note: student_sections table does NOT have timestamps in current migration
                        ]);
                    }
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
