<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLegend;
use Illuminate\Http\Request;

class AttendanceLegendController extends Controller
{
    public function index(Request $request)
    {
        $query = AttendanceLegend::query();
        if ($branchId = $request->header('branch-id') ?? $request->branch_id) {
            $query->where('branch_id', $branchId);
        }
        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'required|string',
            'type' => 'nullable|in:Employee,Student',
            'treat_as' => 'required|in:present,absent',
            'total_leaves' => 'nullable|integer',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        return response()->json(AttendanceLegend::create($validated), 201);
    }

    public function show(AttendanceLegend $attendanceLegend)
    {
        return response()->json($attendanceLegend);
    }

    public function update(Request $request, AttendanceLegend $attendanceLegend)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'required|string',
            'type' => 'nullable|in:Employee,Student',
            'treat_as' => 'required|in:present,absent',
            'total_leaves' => 'nullable|integer',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $attendanceLegend->update($validated);
        return response()->json($attendanceLegend);
    }

    public function destroy(AttendanceLegend $attendanceLegend)
    {
        $attendanceLegend->delete();
        return response()->json(['message' => 'Legend deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        switch($validated['action']) {
            case 'delete': AttendanceLegend::whereIn('id', $ids)->delete(); break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
