<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\Request;

class StateController extends Controller
{
    public function index(Request $request)
    {
        $query = State::query()->with('country');
        if ($request->has('country_id') && $request->country_id) {
            $query->where('country_id', $request->country_id);
        }
        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'country_id' => 'required|exists:countries,id',
        ]);

        return response()->json(State::create($validated), 201);
    }

    public function show(State $state)
    {
        return response()->json($state->load('country'));
    }

    public function update(Request $request, State $state)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'country_id' => 'required|exists:countries,id',
        ]);

        $state->update($validated);
        return response()->json($state);
    }

    public function destroy(State $state)
    {
        $state->delete();
        return response()->json(['message' => 'State deleted successfully']);
    }
}
