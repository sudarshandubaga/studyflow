<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StaffAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'branch_id' => 'nullable|exists:school_branches,id'
        ]);

        $branchId = $request->branch_id ?? $request->header('branch-id');
        
        $attendance = StaffAttendance::where('attendance_date', $request->date)
            ->where('school_id', $request->user()->school_id)
            ->when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->get();

        return response()->json($attendance);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'branch_id' => 'nullable|exists:school_branches,id',
            'attendance' => 'required|array',
            'attendance.*.user_id' => 'required|exists:users,id',
            'attendance.*.attendance_legend_id' => 'required|exists:attendance_legends,id',
            'attendance.*.is_half_day' => 'boolean',
            'attendance.*.time_slots' => 'nullable|array',
        ]);

        $schoolId = $request->user()->school_id;
        $branchId = $validated['branch_id'] ?? $request->header('branch-id');

        DB::beginTransaction();
        try {
            foreach ($validated['attendance'] as $data) {
                StaffAttendance::updateOrCreate(
                    [
                        'user_id' => $data['user_id'],
                        'attendance_date' => $validated['date'],
                        'branch_id' => $branchId,
                    ],
                    [
                        'attendance_legend_id' => $data['attendance_legend_id'],
                        'is_half_day' => $data['is_half_day'] ?? false,
                        'time_slots' => $data['time_slots'] ?? [],
                        'school_id' => $schoolId,
                    ]
                );
            }
            DB::commit();
            return response()->json(['message' => 'Attendance saved successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save attendance', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'branch_id' => 'nullable|exists:school_branches,id'
        ]);

        $branchId = $request->branch_id ?? $request->header('branch-id');

        StaffAttendance::where('attendance_date', $request->date)
            ->where('school_id', $request->user()->school_id)
            ->when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->delete();

        return response()->json(['message' => 'Attendance deleted successfully']);
    }
}
