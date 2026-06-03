<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSetting;
use Illuminate\Http\Request;

class AttendanceSettingController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->header('branch-id') ?? $request->branch_id;
        $setting = AttendanceSetting::where('branch_id', $branchId)->first();
        
        if (!$setting && $branchId) {
            $setting = AttendanceSetting::create(['branch_id' => $branchId]);
        }
        
        return response()->json($setting);
    }

    public function update(Request $request)
    {
        $branchId = $request->header('branch-id') ?? $request->branch_id;
        
        $validated = $request->validate([
            'default_in_time' => 'nullable|string',
            'default_out_time' => 'nullable|string',
            'mark_attendance_on_weekend' => 'boolean'
        ]);

        $setting = AttendanceSetting::updateOrCreate(
            ['branch_id' => $branchId],
            $validated
        );

        return response()->json($setting);
    }
}
