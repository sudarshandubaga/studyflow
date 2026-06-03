<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeFine;
use Illuminate\Http\Request;

class FeeFineController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeFine::query();
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->session_id) $query->where('session_id', $request->session_id);
        
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:sessions,id',
            'grace_period' => 'required|integer|min:0',
            'fine_type' => 'required|in:Normal,Slab',
            'time_period' => 'required|in:Daily,Weekly,Forthnightly,Monthly',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:school_branches,id',
        ]);

        $feeFine = FeeFine::create($validated);
        return response()->json($feeFine, 201);
    }

    public function update(Request $request, FeeFine $feeFine)
    {
        $validated = $request->validate([
            'grace_period' => 'required|integer|min:0',
            'fine_type' => 'required|in:Normal,Slab',
            'time_period' => 'required|in:Daily,Weekly,Forthnightly,Monthly',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $feeFine->update($validated);
        return response()->json($feeFine);
    }

    public function destroy(FeeFine $feeFine)
    {
        $feeFine->delete();
        return response()->json(null, 204);
    }
}
