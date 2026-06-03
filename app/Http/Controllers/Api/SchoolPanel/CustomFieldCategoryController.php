<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\CustomFieldCategory;
use Illuminate\Http\Request;

class CustomFieldCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomFieldCategory::with(['customFields' => function($q) {
            $q->where('is_active', true)->orderBy('sort_order', 'asc');
        }]);

        if ($schoolId = $request->header('school-id') ?? $request->user()->school_id) {
            $query->where('school_id', $schoolId);
        }
        
        if ($type = $request->type) {
            $query->where('type', $type);
        }
        
        return response()->json($query->orderBy('sort_order', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'type' => 'required|in:Employee,Student',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        return response()->json(CustomFieldCategory::create($validated), 201);
    }

    public function show(CustomFieldCategory $customFieldCategory)
    {
        return response()->json($customFieldCategory);
    }

    public function update(Request $request, CustomFieldCategory $customFieldCategory)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'type' => 'required|in:Employee,Student',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $customFieldCategory->update($validated);
        return response()->json($customFieldCategory);
    }

    public function destroy(CustomFieldCategory $customFieldCategory)
    {
        $customFieldCategory->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        switch($validated['action']) {
            case 'delete': CustomFieldCategory::whereIn('id', $ids)->delete(); break;
            case 'enable': CustomFieldCategory::whereIn('id', $ids)->update(['is_active' => true]); break;
            case 'disable': CustomFieldCategory::whereIn('id', $ids)->update(['is_active' => false]); break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
