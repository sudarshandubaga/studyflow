<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeBank;
use Illuminate\Http\Request;

class FeeBankController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeBank::query();
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'branch_id' => 'required|exists:school_branches,id',
        ]);

        $validated['school_id'] = $request->user()->school_id;

        $feeBank = FeeBank::create($validated);
        return response()->json($feeBank, 201);
    }

    public function update(Request $request, FeeBank $feeBank)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'is_active' => 'boolean'
        ]);

        $feeBank->update($validated);
        return response()->json($feeBank);
    }

    public function destroy(FeeBank $feeBank)
    {
        $feeBank->delete();
        return response()->json(null, 204);
    }
}
