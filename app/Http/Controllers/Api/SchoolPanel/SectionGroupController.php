<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\SectionGroup;
use Illuminate\Http\Request;

class SectionGroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $section_id = $request->section_id;
        $groups = SectionGroup::where('section_id', $section_id)->get();
        return response()->json($groups);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'section_id' => 'required|exists:sections,id',
        ]);

        $group = SectionGroup::create($validated);
        return response()->json($group, 201);
    }

    /**
     * Bulk store multiple groups.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'groups' => 'required|array',
            'groups.*' => 'required|string',
        ]);

        $section_id = $validated['section_id'];
        $createdGroups = [];

        foreach ($validated['groups'] as $groupName) {
            $createdGroups[] = SectionGroup::create([
                'name' => $groupName,
                'section_id' => $section_id,
            ]);
        }

        return response()->json($createdGroups, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SectionGroup $sectionGroup)
    {
        return response()->json($sectionGroup);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SectionGroup $sectionGroup)
    {
        $validated = $request->validate([
            'name' => 'required|string',
        ]);

        $sectionGroup->update($validated);
        return response()->json($sectionGroup);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SectionGroup $sectionGroup)
    {
        $sectionGroup->delete();
        return response()->json(['message' => 'Group deleted successfully']);
    }
}
