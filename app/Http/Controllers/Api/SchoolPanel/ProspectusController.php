<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Prospectus;
use Illuminate\Http\Request;

class ProspectusController extends Controller
{
    public function index(Request $request)
    {
        $session_id = $request->header('session-id');
        $branch_id = $request->header('branch-id');

        $prospectuses = Prospectus::with('class')
            ->where('session_id', $session_id)
            ->where('school_branch_id', $branch_id)
            ->orderBy('id', 'desc');

        if ($request->search) {
            $prospectuses->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('form_no', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile_no', 'like', '%' . $request->search . '%');
            });
        }

        $data = $prospectuses->paginate($request->per_page ?? 10);

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $session_id = $request->header('session-id');
        $branch_id = $request->header('branch-id');

        // Logic for auto-generating form_no if not provided or to ensure it follows a sequential pattern
        if (!$request->form_no) {
            $lastProspectus = Prospectus::where('session_id', $session_id)
                ->where('school_branch_id', $branch_id)
                ->orderBy('id', 'desc')
                ->first();
            
            $nextNumber = $lastProspectus ? (int)preg_replace('/[^0-9]/', '', $lastProspectus->form_no) + 1 : 1;
            $request->merge(['form_no' => str_pad($nextNumber, 4, '0', STR_PAD_LEFT)]);
        }

        $validated = $request->validate([
            'form_no' => 'required|string|unique:prospectuses,form_no,NULL,id,session_id,' . $session_id . ',school_branch_id,' . $branch_id,
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string',
            'father_name' => 'required|string',
            'mobile_no' => 'required|string',
            'total_amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'payment_mode' => 'required|string',
            'interaction_type' => 'required|string',
            'meeting_id' => 'nullable|string',
            'test_date' => 'nullable|date',
            'test_time' => 'nullable',
        ]);

        $validated['session_id'] = $session_id;
        $validated['school_branch_id'] = $branch_id;
        $validated['status'] = 'Prospectus';

        $prospectus = Prospectus::create($validated);

        return response()->json($prospectus, 201);
    }

    public function show($id)
    {
        $prospectus = Prospectus::with('class')->findOrFail($id);
        return response()->json($prospectus);
    }

    public function update(Request $request, $id)
    {
        $prospectus = Prospectus::findOrFail($id);
        
        $session_id = $request->header('session-id');

        $validated = $request->validate([
            'form_no' => 'required|string|unique:prospectuses,form_no,' . $id . ',id,session_id,' . $request->header('session-id') . ',school_branch_id,' . $request->header('branch-id'),
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string',
            'father_name' => 'required|string',
            'mobile_no' => 'required|string',
            'total_amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'payment_mode' => 'required|string',
            'interaction_type' => 'required|string',
            'meeting_id' => 'nullable|string',
            'test_date' => 'nullable|date',
            'test_time' => 'nullable',
            'status' => 'nullable|string',
        ]);

        $prospectus->update($validated);

        return response()->json($prospectus);
    }

    public function destroy($id)
    {
        $prospectus = Prospectus::findOrFail($id);
        $prospectus->delete();
        return response()->json(['message' => 'Prospectus deleted successfully']);
    }

    public function findByFormNo(Request $request)
    {
        $session_id = $request->header('session-id');
        $branch_id = $request->header('branch-id');
        
        $prospectus = Prospectus::with('class')
            ->where('session_id', $session_id)
            ->where('school_branch_id', $branch_id)
            ->where('form_no', $request->form_no)
            ->firstOrFail();

        return response()->json($prospectus);
    }

    public function nextFormNo(Request $request)
    {
        $session_id = $request->header('session-id');
        $branch_id = $request->header('branch-id');

        $lastProspectus = Prospectus::where('session_id', $session_id)
            ->where('school_branch_id', $branch_id)
            ->orderBy('id', 'desc')
            ->first();
        
        $nextNumber = $lastProspectus ? (int)preg_replace('/[^0-9]/', '', $lastProspectus->form_no) + 1 : 1;
        return response()->json(['next_form_no' => str_pad($nextNumber, 4, '0', STR_PAD_LEFT)]);
    }
}
