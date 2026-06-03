<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use App\Models\FeeStructure;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function getFeeTypes()
    {
        return response()->json(FeeType::all());
    }

    public function storeFeeType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
            'school_branch_id' => 'required',
        ]);
        return response()->json(FeeType::create($validated), 201);
    }

    public function getFeeStructures()
    {
        return response()->json(FeeStructure::with('feeType', 'eduClass')->get());
    }

    public function storeFeeStructure(Request $request)
    {
        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
            'edu_class_id' => 'required|exists:classes,id',
            'amount' => 'required|numeric',
            'session_id' => 'required|exists:sessions,id',
        ]);
        return response()->json(FeeStructure::create($validated), 201);
    }
}
