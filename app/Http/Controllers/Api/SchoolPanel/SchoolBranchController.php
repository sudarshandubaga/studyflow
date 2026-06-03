<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\SchoolBranch;
use Illuminate\Http\Request;

class SchoolBranchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // If the user is an owner, they use their school_id
        if ($user->role === 'owner') {
            if (!$user->school_id) return response()->json([]);
            return response()->json(SchoolBranch::where('school_id', $user->school_id)->get());
        }

        // For non-owners, fallback to their assigned branch
        $branch = $user->schoolBranch;
        if (!$branch) return response()->json([]);

        return response()->json(SchoolBranch::where('school_id', $branch->school_id)->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'owner' && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $schoolId = $user->role === 'owner' ? $user->school_id : $user->schoolBranch?->school_id;
        if (!$schoolId) return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        $validated['school_id'] = $schoolId;

        $newBranch = SchoolBranch::create($validated);
        return response()->json($newBranch, 201);
    }

    public function update(Request $request, SchoolBranch $schoolBranch)
    {
        $user = $request->user();
        $schoolId = $user->role === 'owner' ? $user->school_id : $user->schoolBranch?->school_id;

        if (!$schoolId || $schoolId !== $schoolBranch->school_id || ($user->role !== 'owner' && $user->role !== 'admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        $schoolBranch->update($validated);
        return response()->json($schoolBranch);
    }

    public function destroy(Request $request, SchoolBranch $schoolBranch)
    {
        $user = $request->user();
        $schoolId = $user->role === 'owner' ? $user->school_id : null;

        if (!$schoolId || $schoolId !== $schoolBranch->school_id || $user->role !== 'owner') {
            return response()->json(['message' => 'Unauthorized. Only owners can delete branches.'], 403);
        }

        $schoolBranch->delete();
        return response()->json(null, 204);
    }
}
