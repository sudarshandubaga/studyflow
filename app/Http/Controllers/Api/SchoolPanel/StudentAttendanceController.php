<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\AttendanceLegend;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentAttendanceController extends Controller
{
    public function getAttendanceBatch(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
        ]);

        $sessionId = $request->header('session-id') ?: 1;
        $schoolId = auth()->user()->school_id;

        // 1. Get Students
        $students = Student::where('section_id', $request->section_id)
            ->where('school_id', $schoolId)
            ->get();

        // 2. Get existing attendance for this date
        $attendance = StudentAttendance::whereIn('student_id', $students->pluck('id'))
            ->where('date', $request->date)
            ->get()
            ->keyBy('student_id');

        // 3. Get Legends
        $legends = AttendanceLegend::where('session_id', $sessionId)->get();

        return response()->json([
            'students' => $students,
            'attendance' => $attendance,
            'legends' => $legends
        ]);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'attendance' => 'required|array',
            'attendance.*.student_id' => 'required|exists:students,id',
            'attendance.*.legend_id' => 'required|exists:attendance_legends,id',
        ]);

        $schoolId = auth()->user()->school_id;
        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id') ?: 1;

        DB::beginTransaction();
        try {
            foreach ($request->attendance as $item) {
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $item['student_id'],
                        'date' => $request->date,
                    ],
                    [
                        'attendance_legend_id' => $item['legend_id'],
                        'school_id' => $schoolId,
                        'branch_id' => $branchId,
                        'session_id' => $sessionId,
                        'remarks' => $item['remarks'] ?? null,
                    ]
                );
            }

            if ($request->send_sms) {
                // Logic to send SMS for absentees if needed
            }

            DB::commit();
            return response()->json(['message' => 'Attendance saved successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save attendance: ' . $e->getMessage()], 500);
        }
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
        ]);

        $studentIds = Student::where('section_id', $request->section_id)->pluck('id');

        StudentAttendance::whereIn('student_id', $studentIds)
            ->where('date', $request->date)
            ->delete();

        return response()->json(['message' => 'Attendance deleted successfully']);
    }
}
