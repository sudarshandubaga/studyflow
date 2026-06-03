<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StudentDocument;
use Illuminate\Http\Request;

class StudentDocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentDocument::query();
        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        return response()->json(StudentDocument::create($validated), 201);
    }

    public function show(StudentDocument $studentDocument)
    {
        return response()->json($studentDocument);
    }

    public function update(Request $request, StudentDocument $studentDocument)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $studentDocument->update($validated);
        return response()->json($studentDocument);
    }

    public function destroy(StudentDocument $studentDocument)
    {
        $studentDocument->delete();
        return response()->json(['message' => 'Document deleted successfully']);
    }
}
