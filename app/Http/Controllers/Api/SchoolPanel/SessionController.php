<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Session;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $query = Session::orderBy('start_date', 'desc');
        if ($branchId = $request->query('branch_id')) {
            $query->where('school_branch_id', $branchId);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'in:active,inactive',
            'branch_id' => 'sometimes|exists:school_branches,id',
        ]);

        $user = $request->user();
        $branchId = $validated['branch_id'] ?? $user->school_branch_id;
        
        if (!$branchId) {
            return response()->json(['message' => 'School branch ID is required.'], 422);
        }

        $validated['school_branch_id'] = $branchId;
        unset($validated['branch_id']);

        if (isset($validated['is_active']) && $validated['is_active'] === 'active') {
            Session::where('school_branch_id', $branchId)
                ->update(['is_active' => 'inactive']);
        }

        $session = Session::create($validated);
        return response()->json($session, 201);
    }

    public function update(Request $request, Session $session)
    {
        $validated = $request->validate([
            'name' => 'string',
            'start_date' => 'date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'in:active,inactive',
        ]);

        if (isset($validated['is_active']) && $validated['is_active'] === 'active') {
            Session::where('school_branch_id', $session->school_branch_id)
                ->where('id', '!=', $session->id)
                ->update(['is_active' => 'inactive']);
        }

        $session->update($validated);
        return response()->json($session);
    }

    public function destroy(Session $session)
    {
        $session->delete();
        return response()->json(null, 204);
    }
}
