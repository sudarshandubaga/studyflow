<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\CustomField;
use Illuminate\Http\Request;

class CustomFieldController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomField::with('category');
        
        if ($categoryId = $request->custom_field_category_id) {
            $query->where('custom_field_category_id', $categoryId);
        } else if ($schoolId = $request->header('school-id') ?? $request->school_id) {
            $query->whereHas('category', function($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
        }
        
        return response()->json($query->orderBy('sort_order', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'custom_field_category_id' => 'required|exists:custom_field_categories,id',
            'name' => 'required|string',
            'field_type' => 'required|in:Textbox,textarea,Pulldown,radio,checkbox,date',
            'data_type' => 'required|in:Numeric,Alpha-Numeric,Alphabetic,Alphabetic Special,Alphanumeric Special,Numeric Special',
            'options' => 'nullable|string',
            'is_mandatory' => 'boolean',
            'show_on_table' => 'boolean',
            'default_value' => 'nullable|string',
            'placeholder' => 'nullable|string',
            'validation_message' => 'nullable|string',
            'max_length' => 'nullable|integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        return response()->json(CustomField::create($validated), 201);
    }

    public function show(CustomField $customField)
    {
        return response()->json($customField->load('category'));
    }

    public function update(Request $request, CustomField $customField)
    {
        $validated = $request->validate([
            'custom_field_category_id' => 'required|exists:custom_field_categories,id',
            'name' => 'required|string',
            'field_type' => 'required|in:Textbox,textarea,Pulldown,radio,checkbox,date',
            'data_type' => 'required|in:Numeric,Alpha-Numeric,Alphabetic,Alphabetic Special,Alphanumeric Special,Numeric Special',
            'options' => 'nullable|string',
            'is_mandatory' => 'boolean',
            'show_on_table' => 'boolean',
            'default_value' => 'nullable|string',
            'placeholder' => 'nullable|string',
            'validation_message' => 'nullable|string',
            'max_length' => 'nullable|integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $customField->update($validated);
        return response()->json($customField);
    }

    public function destroy(CustomField $customField)
    {
        $customField->delete();
        return response()->json(['message' => 'Field deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string'
        ]);

        $ids = $validated['ids'];
        switch($validated['action']) {
            case 'delete': CustomField::whereIn('id', $ids)->delete(); break;
            case 'enable': CustomField::whereIn('id', $ids)->update(['is_active' => true]); break;
            case 'disable': CustomField::whereIn('id', $ids)->update(['is_active' => false]); break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
