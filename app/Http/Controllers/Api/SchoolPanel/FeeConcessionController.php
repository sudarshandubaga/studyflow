<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeConcession;
use App\Models\FeeConcessionDetail;
use App\Models\FeeConcessionStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeConcessionController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeConcession::with(['details.head', 'students.student']);
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->session_id) $query->where('session_id', $request->session_id);
        
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'session_id' => 'required|exists:sessions,id',
            'branch_id' => 'required|exists:school_branches,id',
            'details' => 'required|array|min:1',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.amount_type' => 'required|in:percentage,value',
            'details.*.amount_value' => 'required|numeric',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $concession = FeeConcession::create([
                'name' => $validated['name'],
                'session_id' => $validated['session_id'],
                'branch_id' => $validated['branch_id'],
            ]);

            foreach ($validated['details'] as $detail) {
                $concession->details()->create($detail);
            }

            if (!empty($validated['student_ids'])) {
                foreach ($validated['student_ids'] as $sid) {
                    FeeConcessionStudent::create(['fee_concession_id' => $concession->id, 'student_id' => $sid]);
                }
            }

            return response()->json($concession->load(['details.head', 'students.student']), 201);
        });
    }

    public function update(Request $request, FeeConcession $feeConcession)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'is_active' => 'boolean',
            'details' => 'sometimes|required|array|min:1',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.amount_type' => 'required|in:percentage,value',
            'details.*.amount_value' => 'required|numeric',
            'student_ids' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $feeConcession, $request) {
            $feeConcession->update($request->only('name', 'is_active'));

            if (isset($validated['details'])) {
                $feeConcession->details()->delete();
                foreach ($validated['details'] as $detail) {
                    $feeConcession->details()->create($detail);
                }
            }

            if (isset($validated['student_ids'])) {
                $feeConcession->students()->delete();
                foreach ($validated['student_ids'] as $sid) {
                    FeeConcessionStudent::create(['fee_concession_id' => $feeConcession->id, 'student_id' => $sid]);
                }
            }

            return response()->json($feeConcession->load(['details.head', 'students.student']));
        });
    }

    public function bulkAction(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'action' => 'required|string']);
        if ($request->action === 'delete') FeeConcession::whereIn('id', $request->ids)->delete();
        else if ($request->action === 'enable') FeeConcession::whereIn('id', $request->ids)->update(['is_active' => true]);
        else if ($request->action === 'disable') FeeConcession::whereIn('id', $request->ids)->update(['is_active' => false]);
        return response()->json(['message' => 'Success']);
    }

    public function destroy(FeeConcession $feeConcession)
    {
        $feeConcession->delete();
        return response()->json(null, 204);
    }
}
