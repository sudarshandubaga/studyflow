<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\AttendanceLegend;
use App\Models\AttendanceSetting;
use App\Models\StaffDocumentType;
use App\Models\Subject;
use App\Models\Country;
use App\Models\State;
use App\Models\City;
use App\Models\Title;
use App\Models\CustomFieldCategory;
use App\Models\CustomField;
use App\Models\School;
use App\Models\SchoolBranch;
use App\Models\Session;
use Illuminate\Support\Facades\DB;

class LookupsSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        $branch = SchoolBranch::first();
        
        if (!$school || !$branch) {
            $this->command->error('Run SchoolSeeder first!');
            return;
        }

        // Need session for legends
        $session = Session::updateOrCreate(
            ['name' => '2024-25', 'school_branch_id' => $branch->id],
            ['start_date' => '2024-04-01', 'end_date' => '2025-03-31', 'is_active' => 'active']
        );

        // 1. Employee Role & Role Allocation
        $staffRole = Role::updateOrCreate(
            ['name' => 'Staff', 'guard_name' => 'web'],
            ['branch_id' => $branch->id]
        );
        Role::updateOrCreate(
            ['name' => 'Teacher', 'guard_name' => 'web'],
            ['parent_id' => $staffRole->id, 'branch_id' => $branch->id]
        );
        Role::updateOrCreate(
            ['name' => 'Accountant', 'guard_name' => 'web'],
            ['parent_id' => $staffRole->id, 'branch_id' => $branch->id]
        );

        // 2. Attendance Legends
        $legends = [
            ['name' => 'Present', 'short_name' => 'P', 'color' => '#4CAF50', 'type' => 'Employee'],
            ['name' => 'Absent', 'short_name' => 'A', 'color' => '#F44336', 'type' => 'Employee'],
            ['name' => 'Sick Leave', 'short_name' => 'SL', 'color' => '#FF9800', 'type' => 'Employee'],
            ['name' => 'Present', 'short_name' => 'P', 'color' => '#4CAF50', 'type' => 'Student'],
            ['name' => 'Absent', 'short_name' => 'A', 'color' => '#F44336', 'type' => 'Student'],
            ['name' => 'Late', 'short_name' => 'L', 'color' => '#FFEB3B', 'type' => 'Student'],
        ];
        foreach ($legends as $legend) {
            AttendanceLegend::updateOrCreate(
                ['name' => $legend['name'], 'type' => $legend['type'], 'session_id' => $session->id],
                array_merge($legend, ['branch_id' => $branch->id, 'is_active' => true, 'session_id' => $session->id])
            );
        }

        // 3. Attendance Settings
        AttendanceSetting::updateOrCreate(
            ['branch_id' => $branch->id],
            [
                'default_in_time' => '08:00:00',
                'default_out_time' => '14:30:00',
                'mark_attendance_on_weekend' => false
            ]
        );

        // 4. Employee Document Types
        $docs = ['Aadhar Card', 'PAN Card', 'Experience Letter', 'Highest Qualification Degree'];
        foreach ($docs as $doc) {
            StaffDocumentType::updateOrCreate(
                ['name' => $doc, 'branch_id' => $branch->id],
                ['short_name' => strtoupper(substr($doc, 0, 3)), 'is_active' => true]
            );
        }

        // 5. Subjects
        $subjects = [
            ['name' => 'Mathematics', 'code' => 'MATH101'],
            ['name' => 'Science', 'code' => 'SCI101'],
            ['name' => 'English', 'code' => 'ENG101'],
            ['name' => 'Hindi', 'code' => 'HIN101'],
        ];
        foreach ($subjects as $sub) {
            Subject::updateOrCreate(
                ['name' => $sub['name'], 'school_branch_id' => $branch->id],
                array_merge($sub, ['is_active' => true])
            );
        }

        // 6. Location
        $country = Country::updateOrCreate(
            ['name' => 'India', 'branch_id' => $branch->id], 
            ['short_name' => 'IN', 'phone_code' => '91', 'branch_id' => $branch->id]
        );
        $state = State::updateOrCreate(['name' => 'Rajasthan', 'country_id' => $country->id], ['short_name' => 'RJ']);
        City::updateOrCreate(['name' => 'Jodhpur', 'state_id' => $state->id], ['short_name' => 'JU']);

        // 7. Titles
        $titles = [
            ['name' => 'Mr.', 'short_name' => 'Mr', 'gender' => 'Male'],
            ['name' => 'Mrs.', 'short_name' => 'Mrs', 'gender' => 'Female'],
            ['name' => 'Ms.', 'short_name' => 'Ms', 'gender' => 'Female'],
            ['name' => 'Dr.', 'short_name' => 'Dr', 'gender' => 'Both'],
        ];
        foreach ($titles as $t) {
            Title::updateOrCreate(
                ['name' => $t['name'], 'school_id' => $school->id],
                array_merge($t, ['is_active' => true])
            );
        }

        // 8. Custom Field Categories
        $catStudent = CustomFieldCategory::updateOrCreate(
            ['name' => 'Student Identity', 'school_id' => $school->id],
            ['type' => 'Student', 'is_active' => true, 'school_id' => $school->id]
        );
        $catEmployee = CustomFieldCategory::updateOrCreate(
            ['name' => 'Employee Perks', 'school_id' => $school->id],
            ['type' => 'Employee', 'is_active' => true, 'school_id' => $school->id]
        );

        // 9. Custom Fields
        CustomField::updateOrCreate(
            ['name' => 'Blood Group', 'custom_field_category_id' => $catStudent->id],
            [
                'field_type' => 'Pulldown', 
                'data_type' => 'Alphanumeric Special',
                'options' => json_encode(['A+', 'B+', 'O+', 'AB+']), 
                'is_mandatory' => false
            ]
        );
        CustomField::updateOrCreate(
            ['name' => 'Previous School', 'custom_field_category_id' => $catStudent->id],
            [
                'field_type' => 'Textbox', 
                'data_type' => 'Alphanumeric Special',
                'is_mandatory' => false
            ]
        );
        CustomField::updateOrCreate(
            ['name' => 'PF Account Number', 'custom_field_category_id' => $catEmployee->id],
            [
                'field_type' => 'Textbox', 
                'data_type' => 'Alpha-Numeric',
                'is_mandatory' => false
            ]
        );

        $this->command->info('Lookups seeded successfully!');
    }
}
