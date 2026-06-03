<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeHead;
use Illuminate\Http\Request;

class FeeHeadController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeHead::with('category');
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->session_id) $query->where('session_id', $request->session_id);
        
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'is_admission_fee' => 'boolean',
            'is_refundable' => 'boolean',
            'is_once_a_year' => 'boolean',
            'is_once_a_career' => 'boolean',
            'student_category_id' => 'nullable|exists:student_categories,id',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $validated['school_id'] = $request->user()->school_id;

        $feeHead = FeeHead::create($validated);
        return response()->json($feeHead, 201);
    }

    public function update(Request $request, FeeHead $feeHead)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'short_name' => 'nullable|string',
            'is_admission_fee' => 'boolean',
            'is_refundable' => 'boolean',
            'is_once_a_year' => 'boolean',
            'is_once_a_career' => 'boolean',
            'student_category_id' => 'nullable|exists:student_categories,id',
            'school_id' => 'sometimes|required|exists:schools,id',
            'is_active' => 'boolean'
        ]);

        $feeHead->update($validated);
        return response()->json($feeHead);
    }

    public function bulkAction(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'action' => 'required|string']);
        $ids = $request->ids;
        if ($request->action === 'delete') FeeHead::whereIn('id', $ids)->delete();
        else if ($request->action === 'enable') FeeHead::whereIn('id', $ids)->update(['is_active' => true]);
        else if ($request->action === 'disable') FeeHead::whereIn('id', $ids)->update(['is_active' => false]);
        
        return response()->json(['message' => 'Action performed successfully']);
    }

    public function destroy(FeeHead $feeHead)
    {
        $feeHead->delete();
        return response()->json(null, 204);
    }
}
