<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeCharge;
use App\Models\FeeChargeDetail;
use App\Models\BillScheme;
use App\Models\Student;
use Illuminate\Http\Request;

class FeeChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeCharge::with(['billScheme', 'eduClass', 'section', 'student', 'concession', 'details.feeHead', 'createdBy']);

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->header('session-id')) {
            $query->where('session_id', $request->header('session-id'));
        }
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bill_scheme_id' => 'required|exists:bill_schemes,id',
            'class_id' => 'required|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'student_id' => 'nullable|exists:students,id',
            'concession_id' => 'nullable|exists:fee_concessions,id',
            'charge_type' => 'required|in:Class,Section,Individual',
            'total_amount' => 'required|numeric|min:0',
            'concession_amount' => 'nullable|numeric|min:0',
            'net_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
            'details' => 'nullable|array',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.amount' => 'required|numeric|min:0',
            'details.*.concession_amount' => 'nullable|numeric|min:0',
            'details.*.net_amount' => 'required|numeric|min:0',
            'details.*.installment_label' => 'nullable|string',
            'details.*.due_date' => 'nullable|date',
        ]);

        $details = $validated['details'] ?? [];
        unset($validated['details']);
        $validated['created_by'] = $request->user()->id;

        // Determine student IDs to assign fee charge
        $studentIds = [];
        if ($validated['charge_type'] === 'Individual') {
            if (empty($validated['student_id'])) {
                return response()->json(['message' => 'Student is required for Individual charge type.'], 422);
            }
            $studentIds = [$validated['student_id']];
        } elseif ($validated['charge_type'] === 'Section') {
            if (empty($validated['section_id'])) {
                return response()->json(['message' => 'Section is required for Section charge type.'], 422);
            }
            $studentIds = Student::where('section_id', $validated['section_id'])
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        } else { // Class
            $studentIds = Student::whereIn('section_id', function ($query) use ($validated) {
                $query->select('id')->from('sections')->where('class_id', $validated['class_id']);
            })->where('is_active', true)->pluck('id')->toArray();
        }

        if (empty($studentIds)) {
            return response()->json(['message' => 'No active students found in the selected class/section.'], 422);
        }

        $createdCharges = [];

        \DB::transaction(function () use ($validated, $studentIds, $details, &$createdCharges) {
            foreach ($studentIds as $studentId) {
                $data = $validated;
                $data['student_id'] = $studentId;

                $student = Student::find($studentId);
                if ($student) {
                    $data['section_id'] = $student->section_id;
                }

                $charge = FeeCharge::create($data);

                foreach ($details as $detail) {
                    $charge->details()->create($detail);
                }

                $createdCharges[] = $charge;
            }
        });

        $firstCharge = $createdCharges[0];
        return response()->json($firstCharge->load(['billScheme', 'eduClass', 'section', 'student', 'details.feeHead']), 201);
    }

    public function show(FeeCharge $feeCharge)
    {
        return response()->json($feeCharge->load(['billScheme', 'eduClass', 'section', 'student', 'concession', 'details.feeHead']));
    }

    public function update(Request $request, FeeCharge $feeCharge)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:Active,Cancelled',
            'remarks' => 'nullable|string',
        ]);

        $feeCharge->update($validated);
        return response()->json($feeCharge->load(['billScheme', 'details.feeHead']));
    }

    public function destroy(FeeCharge $feeCharge)
    {
        $feeCharge->update(['status' => 'Cancelled']);
        return response()->json(['message' => 'Fee charge cancelled']);
    }

    // Report: Fee Charge Summary
    public function report(Request $request)
    {
        $query = FeeCharge::with(['billScheme', 'eduClass', 'section', 'student', 'details.feeHead'])
            ->where('status', 'Active');

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->header('session-id')) {
            $query->where('session_id', $request->header('session-id'));
        }
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $charges = $query->get();

        return response()->json([
            'charges' => $charges,
            'summary' => [
                'total_charged' => $charges->sum('total_amount'),
                'total_concession' => $charges->sum('concession_amount'),
                'total_net' => $charges->sum('net_amount'),
                'total_records' => $charges->count(),
            ]
        ]);
    }
}
