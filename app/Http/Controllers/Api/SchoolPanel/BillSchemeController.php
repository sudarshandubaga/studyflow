<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\BillScheme;
use App\Models\BillSchemeDetail;
use App\Models\BillSchemeSection;
use App\Models\BillSchemeStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillSchemeController extends Controller
{
    public function index(Request $request)
    {
        $query = BillScheme::with(['details.head', 'sections.section', 'students.student']);
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->session_id) $query->where('session_id', $request->session_id);
        
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'date' => 'nullable|date',
            'slab' => 'nullable|string',
            'session_id' => 'required|exists:sessions,id',
            'branch_id' => 'required|exists:school_branches,id',
            'details' => 'required|array|min:1',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.amount' => 'required|numeric',
            'section_ids' => 'nullable|array',
            'section_ids.*' => 'exists:sections,id',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $scheme = BillScheme::create([
                'name' => $validated['name'],
                'date' => $validated['date'] ?? null,
                'slab' => $validated['slab'] ?? null,
                'session_id' => $validated['session_id'],
                'branch_id' => $validated['branch_id'],
            ]);

            foreach ($validated['details'] as $detail) {
                $scheme->details()->create($detail);
            }

            if (!empty($validated['section_ids'])) {
                foreach ($validated['section_ids'] as $sid) {
                    BillSchemeSection::create(['bill_scheme_id' => $scheme->id, 'section_id' => $sid]);
                }
            }

            if (!empty($validated['student_ids'])) {
                foreach ($validated['student_ids'] as $sid) {
                    BillSchemeStudent::create(['bill_scheme_id' => $scheme->id, 'student_id' => $sid]);
                }
            }

            return response()->json($scheme->load(['details.head', 'sections.section', 'students.student']), 201);
        });
    }

    public function update(Request $request, BillScheme $billScheme)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'date' => 'nullable|date',
            'slab' => 'nullable|string',
            'is_active' => 'boolean',
            'details' => 'sometimes|required|array|min:1',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.amount' => 'required|numeric',
            'section_ids' => 'nullable|array',
            'student_ids' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $billScheme, $request) {
            $billScheme->update($request->only('name', 'date', 'slab', 'is_active'));

            if (isset($validated['details'])) {
                $billScheme->details()->delete();
                foreach ($validated['details'] as $detail) {
                    $billScheme->details()->create($detail);
                }
            }

            if (isset($validated['section_ids'])) {
                $billScheme->sections()->delete();
                foreach ($validated['section_ids'] as $sid) {
                    BillSchemeSection::create(['bill_scheme_id' => $billScheme->id, 'section_id' => $sid]);
                }
            }

            if (isset($validated['student_ids'])) {
                $billScheme->students()->delete();
                foreach ($validated['student_ids'] as $sid) {
                    BillSchemeStudent::create(['bill_scheme_id' => $billScheme->id, 'student_id' => $sid]);
                }
            }

            return response()->json($billScheme->load(['details.head', 'sections.section', 'students.student']));
        });
    }

    public function bulkAction(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'action' => 'required|string']);
        if ($request->action === 'delete') BillScheme::whereIn('id', $request->ids)->delete();
        else if ($request->action === 'enable') BillScheme::whereIn('id', $request->ids)->update(['is_active' => true]);
        else if ($request->action === 'disable') BillScheme::whereIn('id', $request->ids)->update(['is_active' => false]);
        return response()->json(['message' => 'Success']);
    }

    public function destroy(BillScheme $billScheme)
    {
        $billScheme->delete();
        return response()->json(null, 204);
    }
}
