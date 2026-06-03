<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StudentCategory;
use Illuminate\Http\Request;

class StudentCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentCategory::query();
        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        return response()->json(StudentCategory::create($validated), 201);
    }

    public function show(StudentCategory $studentCategory)
    {
        return response()->json($studentCategory);
    }

    public function update(Request $request, StudentCategory $studentCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $studentCategory->update($validated);
        return response()->json($studentCategory);
    }

    public function destroy(StudentCategory $studentCategory)
    {
        $studentCategory->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
