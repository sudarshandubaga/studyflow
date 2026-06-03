<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\EduClass;
use App\Models\Section;
use App\Models\StudentCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function getAcademicStructure(Request $request)
    {
        $query = EduClass::with('sections');

        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        return response()->json($query->get());
    }

    public function index(Request $request)
    {
        $request->validate([
            'section_id' => 'nullable|exists:sections,id',
            'branch_id' => 'nullable|exists:school_branches,id',
        ]);

        $query = Student::with(['section.eduClass', 'category'])
            ->where('school_id', auth()->user()->school_id);

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'gender' => 'required|in:Male,Female,Other',
            'admission_no' => 'required|string', // Enrollment
            'section_id' => 'required|exists:sections,id',
            'dob' => 'nullable|date',
            'doj' => 'nullable|date',
            'father_email_id' => 'nullable|email',
            'father_mobile_no' => 'nullable|string',
            'student_category_id' => 'nullable|exists:student_categories,id',
        ]);

        DB::beginTransaction();
        try {
            // Create Student Record (Complete Data)
            $student = Student::create([
                'school_id' => auth()->user()->school_id,
                'branch_id' => $request->header('branch-id'),
                'session_id' => $request->session_id ?: 1,

                // Personal
                'title_id' => $request->title_id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'gender' => $request->gender,
                'dob' => $request->dob,
                'email' => $request->email,
                'mobile_no' => $request->father_mobile_no,
                'password' => Hash::make($request->admission_no),

                // Academic
                'section_id' => $request->section_id,
                'student_category_id' => $request->student_category_id,
                'enrollment_no' => $request->admission_no,
                'roll_no' => $request->roll_no,
                'doj' => $request->doj,
                'father_email_id' => $request->father_email_id,
                'father_mobile_no' => $request->father_mobile_no,
                'apaar_id' => $request->apaar_id,
                'scholar_id' => $request->scholar_id,
                'country_id' => $request->country_id,
                'state_id' => $request->state_id,
                'city_id' => $request->city_id,
            ]);

            // Handle Custom Fields (Directly on Student model)
            if ($request->custom_fields) {
                foreach ($request->custom_fields as $fieldId => $value) {
                    $student->customFieldValues()->updateOrCreate(
                        ['custom_field_id' => $fieldId],
                        ['value' => is_array($value) ? json_encode($value) : $value]
                    );
                }
            }

            DB::commit();
            return response()->json(['message' => 'Student admitted successfully', 'student' => $student]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to admit student: ' . $e->getMessage()], 500);
        }
    }
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:students,id'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->updates as $update) {
                $student = Student::findOrFail($update['id']);

                // Update Student Record
                $studentData = collect($update)->except(['id', 'custom_fields', 'admission_no'])->toArray();

                // Map admission_no to enrollment_no if present
                if (isset($update['admission_no'])) {
                    $studentData['enrollment_no'] = $update['admission_no'];
                }

                $student->update($studentData);

                // Update Custom Fields
                if (isset($update['custom_fields'])) {
                    foreach ($update['custom_fields'] as $cfId => $val) {
                        $student->customFieldValues()->updateOrCreate(
                            ['custom_field_id' => $cfId],
                            ['value' => is_array($val) ? json_encode($val) : $val]
                        );
                    }
                }
            }
            DB::commit();
            return response()->json(['message' => 'Bulk update successful']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Bulk update failed: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $student = Student::with(['customFieldValues.customField', 'category', 'section.eduClass'])
            ->where('school_id', auth()->user()->school_id)
            ->findOrFail($id);

        return response()->json($student);
    }

    public function update(Request $request, $id)
    {
        $student = Student::where('school_id', auth()->user()->school_id)->findOrFail($id);

        $request->validate([
            'first_name' => 'required|string|max:100',
            'gender' => 'required|in:Male,Female,Other',
            'admission_no' => 'required|string',
            'section_id' => 'required|exists:sections,id',
        ]);

        DB::beginTransaction();
        try {
            $studentData = $request->except(['avatar', 'custom_fields', 'admission_no']);
            $studentData['enrollment_no'] = $request->admission_no;

            $student->update($studentData);

            if ($request->custom_fields) {
                foreach ($request->custom_fields as $fieldId => $value) {
                    $student->customFieldValues()->updateOrCreate(
                        ['custom_field_id' => $fieldId],
                        ['value' => is_array($value) ? json_encode($value) : (string) $value]
                    );
                }
            }

            DB::commit();
            return response()->json(['message' => 'Student updated successfully', 'student' => $student]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Update failed: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $student = Student::where('school_id', auth()->user()->school_id)->findOrFail($id);
        $student->delete();
        return response()->json(['message' => 'Student deleted successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|exists:students,id'
        ]);

        DB::beginTransaction();
        try {
            Student::whereIn('id', $request->ids)
                ->where('school_id', auth()->user()->school_id)
                ->delete();

            DB::commit();
            return response()->json(['message' => 'Students deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Bulk deletion failed: ' . $e->getMessage()], 500);
        }
    }

    public function promote(Request $request)
    {
        $request->validate([
            'promotions' => 'required|array',
            'promotions.*.student_id' => 'required|exists:students,id',
            'promotions.*.target_section_id' => 'required|exists:sections,id',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->promotions as $promo) {
                $student = Student::where('school_id', auth()->user()->school_id)
                    ->findOrFail($promo['student_id']);

                $student->update(['section_id' => $promo['target_section_id']]);

                // Also update legacy join table if it exists
                if (Schema::hasTable('student_sections')) {
                    DB::table('student_sections')
                        ->where('student_id', $student->id)
                        ->update(['section_id' => $promo['target_section_id']]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Students promoted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Promotion failed: ' . $e->getMessage()], 500);
        }
    }

    public function bulkStatusUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|exists:students,id',
            'is_active' => 'required|boolean'
        ]);

        DB::beginTransaction();
        try {
            Student::whereIn('id', $request->ids)
                ->where('school_id', auth()->user()->school_id)
                ->update(['is_active' => $request->is_active]);

            DB::commit();
            return response()->json(['message' => 'Status updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Status update failed: ' . $e->getMessage()], 500);
        }
    }



}
