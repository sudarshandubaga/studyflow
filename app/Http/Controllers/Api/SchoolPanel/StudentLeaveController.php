<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StudentLeave;
use App\Models\AttendanceLegend;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentLeaveController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id;
        $branchId = $request->header('branch-id');

        $leaves = StudentLeave::with(['student', 'legend'])
            ->where('school_id', $schoolId);

        if ($branchId) {
            $leaves->where('branch_id', $branchId);
        }

        return response()->json($leaves->orderBy('created_at', 'desc')->get());
    }

    public function getStudentLegends(Request $request)
    {
        $sessionId = $request->header('session-id');
        return response()->json(
            AttendanceLegend::where('type', 'Student')
                ->where('session_id', $sessionId)
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'attendance_legend_id' => 'required|exists:attendance_legends,id',
            'from_date' => 'required|date',
            'upto_date' => 'required|date|after_or_equal:from_date',
            'is_half_day' => 'boolean',
            'reason' => 'nullable|string',
        ]);

        $schoolId = auth()->user()->school_id;
        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id');

        try {
            $leave = StudentLeave::create([
                'student_id' => $request->student_id,
                'attendance_legend_id' => $request->attendance_legend_id,
                'from_date' => $request->from_date,
                'upto_date' => $request->upto_date,
                'is_half_day' => $request->is_half_day ?? false,
                'reason' => $request->reason,
                'status' => 'Approved', // Auto-approved based on standard ERP behavior, can be changed to Pending
                'school_id' => $schoolId,
                'branch_id' => $branchId,
                'session_id' => $sessionId,
            ]);

            if ($request->send_sms) {
                // SMS Logic
            }

            return response()->json($leave, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save leave: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(StudentLeave $leave)
    {
        $leave->delete();
        return response()->json(['message' => 'Leave application deleted']);
    }
}
