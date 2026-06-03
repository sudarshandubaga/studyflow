<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\Request;

class CityController extends Controller
{
    public function index(Request $request)
    {
        $query = City::query()->with(['state.country']);
        if ($request->has('state_id') && $request->state_id) {
            $query->where('state_id', $request->state_id);
        }
        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'state_id' => 'required|exists:states,id',
        ]);

        return response()->json(City::create($validated), 201);
    }

    public function show(City $city)
    {
        return response()->json($city->load('state.country'));
    }

    public function update(Request $request, City $city)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'state_id' => 'required|exists:states,id',
        ]);

        $city->update($validated);
        return response()->json($city);
    }

    public function destroy(City $city)
    {
        $city->delete();
        return response()->json(['message' => 'City deleted successfully']);
    }
}
