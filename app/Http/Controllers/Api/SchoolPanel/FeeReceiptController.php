<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\FeeReceipt;
use App\Models\FeeReceiptDetail;
use App\Models\FeeBillBook;
use Illuminate\Http\Request;

class FeeReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeReceipt::with(['student', 'eduClass', 'section', 'details.feeHead', 'feeBank', 'createdBy']);

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->header('session-id')) {
            $query->where('session_id', $request->header('session-id'));
        }
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('receipt_date', [$request->from_date, $request->to_date]);
        }
        if ($request->has('payment_mode')) {
            $query->where('payment_mode', $request->payment_mode);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'nullable|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'receipt_date' => 'required|date',
            'payment_mode' => 'required|in:Cash,Cheque,Online,DD,Bank Transfer',
            'total_amount' => 'required|numeric|min:0',
            'fine_amount' => 'nullable|numeric|min:0',
            'concession_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'bank_name' => 'nullable|string',
            'transaction_id' => 'nullable|string',
            'remarks' => 'nullable|string',
            'fee_bank_id' => 'nullable|exists:fee_banks,id',
            'branch_id' => 'required|exists:school_branches,id',
            'session_id' => 'required|exists:sessions,id',
            'details' => 'required|array|min:1',
            'details.*.fee_head_id' => 'required|exists:fee_heads,id',
            'details.*.fee_charge_detail_id' => 'nullable|exists:fee_charge_details,id',
            'details.*.amount' => 'required|numeric|min:0',
            'details.*.fine_amount' => 'nullable|numeric|min:0',
            'details.*.concession_amount' => 'nullable|numeric|min:0',
            'details.*.paid_amount' => 'required|numeric|min:0',
            'details.*.installment_label' => 'nullable|string',
        ]);

        $details = $validated['details'];
        unset($validated['details']);

        // Generate receipt number
        $validated['receipt_no'] = $this->generateReceiptNo($validated['branch_id'], $validated['session_id']);
        $validated['created_by'] = $request->user()->id;

        $receipt = FeeReceipt::create($validated);

        foreach ($details as $detail) {
            $receipt->details()->create($detail);
        }

        return response()->json($receipt->load(['student', 'eduClass', 'section', 'details.feeHead']), 201);
    }

    public function show(FeeReceipt $feeReceipt)
    {
        return response()->json($feeReceipt->load(['student', 'eduClass', 'section', 'details.feeHead', 'feeBank', 'createdBy', 'cancelledBy']));
    }

    public function cancel(Request $request, FeeReceipt $feeReceipt)
    {
        $validated = $request->validate([
            'cancel_reason' => 'required|string|max:500',
        ]);

        $feeReceipt->update([
            'status' => 'Cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'cancel_reason' => $validated['cancel_reason'],
        ]);

        return response()->json($feeReceipt->load(['student', 'details.feeHead']));
    }

    // Reports
    public function dueReport(Request $request)
    {
        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id');

        // Get all charges and receipts
        $charges = \App\Models\FeeCharge::with(['student', 'eduClass', 'section', 'details.feeHead'])
            ->where('status', 'Active')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->when($request->class_id, fn($q) => $q->where('class_id', $request->class_id))
            ->get();

        $receipts = FeeReceipt::where('status', 'Paid')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->get()
            ->groupBy('student_id');

        $dueData = $charges->map(function ($charge) use ($receipts) {
            $studentReceipts = $receipts->get($charge->student_id, collect([]));
            $paidAmount = $studentReceipts->sum('paid_amount');
            return [
                'charge' => $charge,
                'total_charged' => $charge->net_amount,
                'total_paid' => $paidAmount,
                'due_amount' => $charge->net_amount - $paidAmount,
            ];
        })->filter(fn($item) => $item['due_amount'] > 0);

        return response()->json([
            'data' => $dueData->values(),
            'summary' => [
                'total_due' => $dueData->sum('due_amount'),
                'total_charged' => $dueData->sum('total_charged'),
                'total_paid' => $dueData->sum('total_paid'),
                'students_with_due' => $dueData->count(),
            ]
        ]);
    }

    public function cancelledReport(Request $request)
    {
        $query = FeeReceipt::with(['student', 'eduClass', 'section', 'details.feeHead', 'cancelledBy'])
            ->where('status', 'Cancelled');

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->header('session-id')) {
            $query->where('session_id', $request->header('session-id'));
        }
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('cancelled_at', [$request->from_date, $request->to_date]);
        }

        return response()->json($query->orderByDesc('cancelled_at')->get());
    }

    public function headwiseReport(Request $request)
    {
        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id');

        $details = FeeReceiptDetail::with(['feeHead', 'feeReceipt.student', 'feeReceipt.eduClass'])
            ->whereHas('feeReceipt', function ($q) use ($branchId, $sessionId, $request) {
                $q->where('status', 'Paid');
                if ($branchId) $q->where('branch_id', $branchId);
                if ($sessionId) $q->where('session_id', $sessionId);
                if ($request->has('from_date') && $request->has('to_date')) {
                    $q->whereBetween('receipt_date', [$request->from_date, $request->to_date]);
                }
            })
            ->get()
            ->groupBy('fee_head_id');

        $report = $details->map(function ($headDetails, $headId) {
            return [
                'fee_head' => $headDetails->first()->feeHead,
                'total_collected' => $headDetails->sum('paid_amount'),
                'receipt_count' => $headDetails->count(),
                'total_fine' => $headDetails->sum('fine_amount'),
                'total_concession' => $headDetails->sum('concession_amount'),
            ];
        });

        return response()->json($report->values());
    }

    private function generateReceiptNo($branchId, $sessionId)
    {
        $billBook = FeeBillBook::where('branch_id', $branchId)
            ->where('session_id', $sessionId)
            ->where('is_active', true)
            ->first();

        if ($billBook) {
            $receiptNo = ($billBook->prefix ?? 'RCT') . '-' . str_pad($billBook->current_number, 6, '0', STR_PAD_LEFT);
            $billBook->increment('current_number');
            return $receiptNo;
        }

        // Fallback: auto-generate
        $lastReceipt = FeeReceipt::where('branch_id', $branchId)
            ->where('session_id', $sessionId)
            ->orderByDesc('id')
            ->first();

        $nextNo = $lastReceipt ? ((int) substr($lastReceipt->receipt_no, -6)) + 1 : 1;
        return 'RCT-' . str_pad($nextNo, 6, '0', STR_PAD_LEFT);
    }
}
