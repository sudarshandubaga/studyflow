<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::query();
        if ($branchId = $request->header('school-branch-id') ?? $request->school_branch_id) {
            $query->where('school_branch_id', $branchId);
        }
        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
            'school_branch_id' => 'required|exists:school_branches,id',
        ]);

        return response()->json(Subject::create($validated), 201);
    }

    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
            'school_branch_id' => 'required|exists:school_branches,id',
        ]);

        $subject->update($validated);
        return response()->json($subject);
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return response()->json(['message' => 'Subject deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        $action = $validated['action'];

        if ($action === 'delete') {
            Subject::whereIn('id', $ids)->delete();
        } elseif ($action === 'enable') {
            Subject::whereIn('id', $ids)->update(['is_active' => true]);
        } elseif ($action === 'disable') {
            Subject::whereIn('id', $ids)->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
