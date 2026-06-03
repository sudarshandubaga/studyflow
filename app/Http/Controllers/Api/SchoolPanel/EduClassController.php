<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\EduClass;
use Illuminate\Http\Request;

class EduClassController extends Controller
{
    public function index(Request $request)
    {
        $query = EduClass::with('sections.groups')->orderBy('position', 'asc')->orderBy('name', 'asc');
        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }
        return response()->json($query->get());
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:classes,id',
        ]);

        foreach ($validated['class_ids'] as $index => $id) {
            EduClass::where('id', $id)->update(['position' => $index]);
        }

        return response()->json(['message' => 'Order updated successfully']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        return response()->json(EduClass::create($validated), 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'classes' => 'required|array',
            'classes.*' => 'required|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $created = [];
        foreach ($validated['classes'] as $name) {
            $created[] = EduClass::create([
                'name' => $name,
                'session_id' => $validated['session_id'],
            ]);
        }

        return response()->json($created, 201);
    }

    public function update(Request $request, EduClass $class)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $class->update($validated);
        return response()->json($class);
    }

    public function destroy(EduClass $class)
    {
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
