<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Section::with('eduClass');
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'class_id' => 'required|exists:classes,id',
        ]);

        return response()->json(Section::create($validated), 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'sections' => 'required|array',
            'sections.*' => 'required|string',
            'class_id' => 'required|exists:classes,id',
        ]);

        $created = [];
        foreach ($validated['sections'] as $name) {
            $created[] = Section::create([
                'name' => $name,
                'class_id' => $validated['class_id'],
            ]);
        }

        return response()->json($created, 201);
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'class_id' => 'required|exists:classes,id',
        ]);

        $section->update($validated);
        return response()->json($section);
    }

    public function destroy(Section $section)
    {
        $section->delete();
        return response()->json(['message' => 'Section deleted successfully']);
    }
}
