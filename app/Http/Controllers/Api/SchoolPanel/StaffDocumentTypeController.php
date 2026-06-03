<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StaffDocumentType;
use Illuminate\Http\Request;

class StaffDocumentTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = StaffDocumentType::query();
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
            'short_name' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        return response()->json(StaffDocumentType::create($validated), 201);
    }

    public function show(StaffDocumentType $staffDocumentType)
    {
        return response()->json($staffDocumentType);
    }

    public function update(Request $request, StaffDocumentType $staffDocumentType)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:school_branches,id',
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $staffDocumentType->update($validated);
        return response()->json($staffDocumentType);
    }

    public function destroy(StaffDocumentType $staffDocumentType)
    {
        $staffDocumentType->delete();
        return response()->json(['message' => 'Document type deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        switch($validated['action']) {
            case 'delete': StaffDocumentType::whereIn('id', $ids)->delete(); break;
            case 'enable': StaffDocumentType::whereIn('id', $ids)->update(['is_active' => true]); break;
            case 'disable': StaffDocumentType::whereIn('id', $ids)->update(['is_active' => false]); break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
