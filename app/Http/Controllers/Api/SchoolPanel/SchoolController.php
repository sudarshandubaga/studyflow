<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function show(Request $request)
    {
        // Assuming user belongs to a branch which belongs to a school
        $school = $request->user()->school;
        if (!$school) {
            return response()->json(['message' => 'User does not belong to a branch'], 400);
        }

        return response()->json($school);
    }

    public function update(Request $request)
    {
        $school = $request->user()->school;
        if (!$school) {
            return response()->json(['message' => 'User does not belong to a branch'], 400);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'domain' => 'required|string|max:255|unique:schools,domain,' . $school->id,
            'timezone' => 'required|string|max:255',
        ]);

        $school->update($validated);

        return response()->json($school);
    }
}
