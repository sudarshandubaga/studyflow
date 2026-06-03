<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeBillBook;
use Illuminate\Http\Request;

class FeeBillBookController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeBillBook::query();
        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->header('session-id')) {
            $query->where('session_id', $request->header('session-id'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:20',
            'start_number' => 'required|integer|min:1',
            'end_number' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $validated['current_number'] = $validated['start_number'];

        return response()->json(FeeBillBook::create($validated), 201);
    }

    public function show(FeeBillBook $feeBillBook)
    {
        return response()->json($feeBillBook);
    }

    public function update(Request $request, FeeBillBook $feeBillBook)
    {
        $validated = $request->validate([
            'book_name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:20',
            'start_number' => 'required|integer|min:1',
            'end_number' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
        ]);

        $feeBillBook->update($validated);
        return response()->json($feeBillBook);
    }

    public function destroy(FeeBillBook $feeBillBook)
    {
        $feeBillBook->delete();
        return response()->json(['message' => 'Bill book deleted successfully']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'action' => 'required|string|in:delete,activate,deactivate'
        ]);

        $ids = $validated['ids'];
        switch ($validated['action']) {
            case 'delete':
                FeeBillBook::whereIn('id', $ids)->delete();
                break;
            case 'activate':
                FeeBillBook::whereIn('id', $ids)->update(['is_active' => true]);
                break;
            case 'deactivate':
                FeeBillBook::whereIn('id', $ids)->update(['is_active' => false]);
                break;
        }

        return response()->json(['message' => 'Bulk action successful']);
    }
}
