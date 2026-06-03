<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        $query = Country::query();
        if ($branchId = $request->header('school-branch-id') ?? $request->branch_id) {
            $query->where('branch_id', $branchId);
        }
        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'branch_id' => 'required|exists:school_branches,id',
        ]);

        return response()->json(Country::create($validated), 201);
    }

    public function show(Country $country)
    {
        return response()->json($country);
    }

    public function update(Request $request, Country $country)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'short_name' => 'nullable|string',
            'branch_id' => 'required|exists:school_branches,id',
        ]);

        $country->update($validated);
        return response()->json($country);
    }

    public function destroy(Country $country)
    {
        $country->delete();
        return response()->json(['message' => 'Country deleted successfully']);
    }
}
