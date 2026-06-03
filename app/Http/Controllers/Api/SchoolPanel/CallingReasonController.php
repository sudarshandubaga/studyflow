<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\CallingReason;
use Illuminate\Http\Request;

class CallingReasonController extends Controller
{
    public function index(Request $request)
    {
        $query = CallingReason::query();
        if ($branchId = $request->header('branch-id') ?? $request->branch_id) {
            $query->where('branch_id', $branchId);
        }
        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:school_branches,id',
            'name' => 'required|string',
            'is_active' => 'boolean'
        ]);

        return response()->json(CallingReason::create($validated), 201);
    }

    public function show(CallingReason $callingReason)
    {
        return response()->json($callingReason);
    }

    public function update(Request $request, CallingReason $callingReason)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:school_branches,id',
            'name' => 'required|string',
            'is_active' => 'boolean'
        ]);

        $callingReason->update($validated);
        return response()->json($callingReason);
    }

    public function destroy(CallingReason $callingReason)
    {
        $callingReason->delete();
        return response()->json(['message' => 'Calling reason deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        switch($validated['action']) {
            case 'delete': CallingReason::whereIn('id', $ids)->delete(); break;
            case 'enable': CallingReason::whereIn('id', $ids)->update(['is_active' => true]); break;
            case 'disable': CallingReason::whereIn('id', $ids)->update(['is_active' => false]); break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
