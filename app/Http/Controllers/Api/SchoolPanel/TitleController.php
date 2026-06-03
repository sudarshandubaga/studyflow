<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Title;
use Illuminate\Http\Request;

class TitleController extends Controller
{
    public function index(Request $request)
    {
        $titles = Title::where('school_id', $request->user()->school_id)
            ->where('is_active', true)
            ->get();
        return response()->json($titles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
            'gender' => 'required|in:Male,Female,Both',
            'is_active' => 'boolean'
        ]);

        $validated['school_id'] = $request->user()->school_id;
        $title = Title::create($validated);
        return response()->json($title, 201);
    }

    public function show(Title $title)
    {
        return response()->json($title);
    }

    public function update(Request $request, Title $title)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'sometimes|required|string|max:50',
            'gender' => 'sometimes|required|in:Male,Female,Both',
            'is_active' => 'boolean'
        ]);

        $title->update($validated);
        return response()->json($title);
    }

    public function destroy(Title $title)
    {
        $title->delete();
        return response()->json(null, 204);
    }
}
