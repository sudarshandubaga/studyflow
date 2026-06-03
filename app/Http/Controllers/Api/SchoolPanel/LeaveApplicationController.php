<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\LeaveApplication;
use App\Models\AttendanceLegend;
use App\Models\StaffAttendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LeaveApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveApplication::with(['user.employee', 'attendanceLegend', 'approver'])
            ->where('school_id', $request->user()->school_id);
            
        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        
        if ($sessionId = $request->session_id) {
            $query->where('session_id', $sessionId);
        }

        if ($userId = $request->user_id) {
            $query->where('user_id', $userId);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'attendance_legend_id' => 'required|exists:attendance_legends,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'is_half_day' => 'boolean',
            'reason' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $validated['school_id'] = $request->user()->school_id;
        $validated['branch_id'] = $request->header('branch-id') ?? $request->user()->school_branch_id;
        
        $leave = LeaveApplication::create($validated);
        
        return response()->json($leave->load(['user', 'attendanceLegend']), 201);
    }

    public function updateStatus(Request $request, LeaveApplication $leaveApplication)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $validated['approved_by'] = $request->user()->id;
        
        $leaveApplication->update($validated);
        
        // If approved, we might automatically mark attendance, but for now we'll just update status
        
        return response()->json($leaveApplication->load(['user', 'attendanceLegend', 'approver']));
    }

    public function balances(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $branchId = $request->header('branch-id');

        // Fetch Leave types (treat_as = absent or total_leaves > 0)
        $legends = AttendanceLegend::where(function($q) {
                $q->where('treat_as', 'absent')
                  ->orWhere('total_leaves', '>', 0);
            })
            ->where('session_id', $request->session_id)
            ->when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->get();

        // Fetch consumed leaves from staff_attendances
        $attendances = StaffAttendance::where('user_id', $request->user_id)
            ->whereIn('attendance_legend_id', $legends->pluck('id'))
            ->get();

        // Fetch also approved leave applications that are in the future or not yet marked as attendance
        $approvedFutureLeaves = LeaveApplication::where('user_id', $request->user_id)
            ->where('session_id', $request->session_id)
            ->where('status', 'approved') // Only count approved leaves ? Or pending as well ? Usually pending consumes block balance. Let's count all non-rejected.
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        $balances = [];

        foreach ($legends as $legend) {
            $total = $legend->total_leaves ?? 0;
            
            // Consumed from attendance records
            $consumedFromAttendance = $attendances->where('attendance_legend_id', $legend->id)
                ->sum(function($record) {
                    return $record->is_half_day ? 0.5 : 1;
                });
                
            // Consumed from approved/pending applied leaves that are not already overlapping with marked attendance
            // A precise calculation would merge date ranges, but a simple sum works for isolated systems
            // For now, we will prefer calculating from Leave applications OR Staff Attendances.
            // Let's rely primarily on StaffAttendances for past, and LeaveApplications for future? 
            // Better: Sum just the staff attendances, and sum leaves from applications that are in the future.
            
            $consumedFromApplications = 0;
            foreach ($approvedFutureLeaves->where('attendance_legend_id', $legend->id) as $app) {
                $from = Carbon::parse($app->from_date);
                $to = Carbon::parse($app->to_date);
                
                // If it's half day, it's 0.5 regardless of days? Usually half-day is 1 day.
                if ($app->is_half_day) {
                    $consumedFromApplications += 0.5;
                } else {
                    $days = $to->diffInDays($from) + 1;
                    $consumedFromApplications += $days;
                }
            }
            
            // Let's just use the max, or combined approach. For a simple system, we just use applications 
            // since they encapsulate the request, or we use attendances. We'll use combined if they don't overlap,
            // but for simplicity, let's just return what is consumed via applications vs actual attendances.
            // Actually, a standard approach: balance -= applied leaves.
            // So we'll use consumedFromApplications + consumedFromAttendance (assuming they don't double count if we only count attendance for dates not in applications).
            // For complete robustness in an MVP, we'll just use consumedFromApplications and consumedFromAttendance (simplistic sum).
            
            // To prevent double counting in MVP, we just use consumedFromAttendance.
            
            $consumed = $consumedFromAttendance;
            
            $balances[] = [
                'legend' => $legend,
                'total' => $total,
                'consumed' => $consumed,
                'remaining' => max(0, $total - $consumed)
            ];
        }

        return response()->json($balances);
    }
}
