<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\FeeReceipt;
use App\Models\FeeReceiptDetail;
use App\Models\BillScheme;
use App\Models\BillSchemeDetail;
use App\Models\BillSchemeStudent;
use App\Models\BillSchemeSection;
use App\Models\EduClass;
use App\Models\FeeHead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeReceiptWizardController extends Controller
{
    /**
     * Step 1: Get receipt types
     * GET /api/school-panel/fee-receipt-wizard/types
     */
    public function types()
    {
        return response()->json([
            'types' => [
                ['id' => 'Student', 'label' => 'Student'],
                ['id' => 'Class', 'label' => 'Class'],
            ],
        ]);
    }

    /**
     * Step 2a: Search students by name or enrollment number
     * GET /api/school-panel/fee-receipt-wizard/search-students?search=john
     */
    public function searchStudents(Request $request)
    {
        $search = $request->query('search');
        $query = Student::with(['section.eduClass'])->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('enrollment_no', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'students' => $query->get()->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'enrollment_no' => $student->enrollment_no,
                    'roll_no' => $student->roll_no,
                    'class' => $student->section?->eduClass?->name ?? 'N/A',
                    'section' => $student->section?->name ?? 'N/A',
                    'section_id' => $student->section_id,
                    'photo' => $student->photo,
                ];
            }),
        ]);
    }

    /**
     * Step 2b & 3: Get classes/sections OR students by section
     * GET /api/school-panel/fee-receipt-wizard/classes
     * GET /api/school-panel/fee-receipt-wizard/classes?section_id=5  → returns students for that section
     */
    public function classes(Request $request)
    {
        $sectionId = $request->query('section_id');

        if ($sectionId) {
            $students = Student::with(['section.eduClass'])
                ->where('section_id', $sectionId)
                ->where('is_active', true)
                ->get()
                ->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'enrollment_no' => $student->enrollment_no,
                        'roll_no' => $student->roll_no,
                        'class' => $student->section?->eduClass?->name ?? 'N/A',
                        'section' => $student->section?->name ?? 'N/A',
                        'section_id' => $student->section_id,
                        'photo' => $student->photo,
                    ];
                });

            return response()->json(['students' => $students]);
        }

        $classes = EduClass::with('sections')->get()->map(function ($class) {
            return [
                'id' => $class->id,
                'name' => $class->name,
                'sections' => $class->sections->map(function ($section) {
                    return [
                        'id' => $section->id,
                        'name' => $section->name,
                    ];
                }),
            ];
        });

        return response()->json(['classes' => $classes]);
    }

    /**
     * Resolve bill schemes for a student
     * - Direct assignment via bill_scheme_students
     * - Via section assignment via bill_scheme_sections
     */
    private function getStudentBillSchemes($studentId, $sectionId)
    {
        $branchId = request()->header('branch-id');
        $sessionId = request()->header('session-id');

        $schemeIds = collect();

        // Direct student assignments
        $directSchemes = BillSchemeStudent::where('student_id', $studentId)
            ->pluck('bill_scheme_id');
        $schemeIds = $schemeIds->merge($directSchemes);

        // Section-level assignments
        if ($sectionId) {
            $sectionSchemes = BillSchemeSection::where('section_id', $sectionId)
                ->pluck('bill_scheme_id');
            $schemeIds = $schemeIds->merge($sectionSchemes);
        }

        // Get unique active schemes
        $schemes = BillScheme::whereIn('id', $schemeIds->unique())
            ->where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->with('details.feeHead')
            ->get();

        return $schemes;
    }

    /**
     * Step 4: Get student info with due fees (auto-computed from bill schemes) & last 10 transactions
     * GET /api/school-panel/fee-receipt-wizard/student-due-details/{student_id}
     */
    public function studentDueDetails($student_id)
    {
        $today = now()->format('Y-m-d');
        $student = Student::with(['section.eduClass'])->findOrFail($student_id);

        $studentInfo = [
            'id' => $student->id,
            'name' => $student->name,
            'enrollment_no' => $student->enrollment_no,
            'roll_no' => $student->roll_no,
            'class' => $student->section?->eduClass?->name ?? 'N/A',
            'section' => $student->section?->name ?? 'N/A',
            'section_id' => $student->section_id,
            'mobile_no' => $student->mobile_no,
            'email' => $student->email,
            'photo' => $student->photo,
        ];

        // Get bill schemes for this student (direct + section level)
        $schemes = $this->getStudentBillSchemes($student->id, $student->section_id);

        // Build due items: group bill scheme details by fee_head_id
        $dueItems = [];
        $processedHeads = [];
        $allFeeHeadIds = [];

        foreach ($schemes as $scheme) {
            foreach ($scheme->details as $detail) {
                $allFeeHeadIds[] = $detail->fee_head_id;
            }
        }
        $allFeeHeadIds = array_unique($allFeeHeadIds);

        // Get total already paid per fee_head for this student
        $paidPerHead = collect();
        if (!empty($allFeeHeadIds)) {
            $paidPerHead = FeeReceiptDetail::whereHas('feeReceipt', function ($q) use ($student_id) {
                $q->where('student_id', $student_id)->where('status', 'Paid');
            })
                ->whereIn('fee_head_id', $allFeeHeadIds)
                ->selectRaw('fee_head_id, SUM(paid_amount) as total_paid')
                ->groupBy('fee_head_id')
                ->get()
                ->keyBy('fee_head_id');
        }

        foreach ($schemes as $scheme) {
            foreach ($scheme->details as $detail) {
                $headId = $detail->fee_head_id;

                // Skip if we already processed this fee head
                if (in_array($headId, $processedHeads)) {
                    continue;
                }

                $feeHeadName = $detail->feeHead?->name ?? 'Unknown';
                $totalChargeable = (float) $detail->amount;
                $alreadyPaid = (float) ($paidPerHead->get($headId)?->total_paid ?? 0);
                $dueAmount = max(0, $totalChargeable - $alreadyPaid);

                // BillSchemeDetail table only has: fee_head_id + amount (no installment_label or due_date)
                $installmentLabel = $scheme->slab ?? null;

                // Only include if there's a due amount
                if ($dueAmount > 0) {
                    $dueItems[] = [
                        'due_item_id' => 'head_' . $headId,
                        'fee_head_id' => $headId,
                        'fee_head_name' => $feeHeadName,
                        'bill_scheme_name' => $scheme->name,
                        'original_amount' => $totalChargeable,
                        'concession_amount' => 0,
                        'net_amount' => $totalChargeable,
                        'already_paid' => $alreadyPaid,
                        'due_amount' => $dueAmount,
                        'installment_label' => $installmentLabel,
                        'due_date' => null,
                    ];
                }

                $processedHeads[] = $headId;
            }
        }

        // Last 10 paid receipts
        $recentReceipts = FeeReceipt::where('student_id', $student_id)
            ->where('status', 'Paid')
            ->with(['details.feeHead'])
            ->orderByDesc('receipt_date')
            ->limit(10)
            ->get()
            ->map(function ($receipt) {
                return [
                    'receipt_id' => $receipt->id,
                    'receipt_no' => $receipt->receipt_no,
                    'receipt_date' => $receipt->receipt_date,
                    'payment_mode' => $receipt->payment_mode,
                    'paid_amount' => (float) $receipt->paid_amount,
                    'fine_amount' => (float) $receipt->fine_amount,
                    'concession_amount' => (float) $receipt->concession_amount,
                    'items' => $receipt->details->map(function ($d) {
                        return [
                            'fee_head_name' => $d->feeHead?->name ?? 'Unknown',
                            'paid_amount' => (float) $d->paid_amount,
                            'installment_label' => $d->installment_label,
                        ];
                    }),
                ];
            });

        $totalDueAmount = collect($dueItems)->sum('due_amount');

        return response()->json([
            'student' => $studentInfo,
            'due_summary' => [
                'total_due_amount' => $totalDueAmount,
                'total_items' => count($dueItems),
            ],
            'bill_schemes' => $schemes->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
            'due_items' => $dueItems,
            'recent_receipts' => $recentReceipts,
        ]);
    }

    /**
     * Step 5: Receive payment for selected due items (computed from bill schemes)
     * POST /api/school-panel/fee-receipt-wizard/receive-payment
     */
    public function receivePayment(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'selected_fee_head_ids' => 'required|array|min:1',
            'selected_fee_head_ids.*' => 'exists:fee_heads,id',
            'receipt_date' => 'required|date',
            'payment_mode' => 'required|in:Cash,Cheque,Online,DD,Bank Transfer',
            'remarks' => 'nullable|string',
            'fee_bank_id' => 'nullable|exists:fee_banks,id',
            'fine_amount' => 'nullable|numeric|min:0',
            'extra_concession' => 'nullable|numeric|min:0',
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $today = now()->format('Y-m-d');

        // Get bill schemes for this student
        $schemes = $this->getStudentBillSchemes($student->id, $student->section_id);

        // Get the amounts from bill scheme details for selected fee heads
        $selectedHeadIds = $validated['selected_fee_head_ids'];
        $billDetailAmounts = [];

        foreach ($schemes as $scheme) {
            foreach ($scheme->details as $detail) {
                if (in_array($detail->fee_head_id, $selectedHeadIds) && !isset($billDetailAmounts[$detail->fee_head_id])) {
                    $billDetailAmounts[$detail->fee_head_id] = [
                        'amount' => (float) $detail->amount,
                        'installment_label' => $detail->installment_label ?? $scheme->slab ?? null,
                        'due_date' => $detail->due_date ?? null,
                    ];
                }
            }
        }

        if (empty($billDetailAmounts)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid bill scheme details found for selected fee heads.',
            ], 422);
        }

        // Get already paid amounts for selected fee heads
        $paidPerHead = FeeReceiptDetail::whereHas('feeReceipt', function ($q) use ($validated) {
            $q->where('student_id', $validated['student_id'])->where('status', 'Paid');
        })
            ->whereIn('fee_head_id', $selectedHeadIds)
            ->selectRaw('fee_head_id, SUM(paid_amount) as total_paid')
            ->groupBy('fee_head_id')
            ->get()
            ->keyBy('fee_head_id');

        // Build receipt detail entries
        $totalOriginalAmount = 0;
        $totalNetAmount = 0;
        $detailEntries = [];

        foreach ($billDetailAmounts as $headId => $headData) {
            $alreadyPaid = (float) ($paidPerHead->get($headId)?->total_paid ?? 0);
            $dueAmount = max(0, $headData['amount'] - $alreadyPaid);

            // Skip if due_date is in the future
            if ($headData['due_date'] && $headData['due_date'] > $today) {
                continue;
            }

            if ($dueAmount <= 0) {
                continue;
            }

            $totalOriginalAmount += $headData['amount'];
            $totalNetAmount += $dueAmount;

            $detailEntries[] = [
                'fee_head_id' => $headId,
                'amount' => $headData['amount'],
                'fine_amount' => 0,
                'concession_amount' => 0,
                'paid_amount' => $dueAmount,
                'installment_label' => $headData['installment_label'],
            ];
        }

        if (empty($detailEntries)) {
            return response()->json([
                'success' => false,
                'message' => 'All selected items have already been fully paid or are not yet due.',
            ], 422);
        }

        $fineAmount = (float) ($validated['fine_amount'] ?? 0);
        $extraConcession = (float) ($validated['extra_concession'] ?? 0);
        $finalPaidAmount = max(0, $totalNetAmount + $fineAmount - $extraConcession);

        $receipt = null;

        DB::transaction(function () use (
            $validated,
            $student,
            $detailEntries,
            $totalOriginalAmount,
            $totalNetAmount,
            $fineAmount,
            $extraConcession,
            $finalPaidAmount,
            $request,
            &$receipt
        ) {
            $receiptData = [
                'student_id' => $student->id,
                'class_id' => $student->section->class_id ?? null,
                'section_id' => $student->section_id,
                'receipt_date' => $validated['receipt_date'],
                'payment_mode' => $validated['payment_mode'],
                'total_amount' => $totalOriginalAmount,
                'fine_amount' => $fineAmount,
                'concession_amount' => $extraConcession,
                'paid_amount' => $finalPaidAmount,
                'fee_bank_id' => $validated['fee_bank_id'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'branch_id' => $request->header('branch-id'),
                'session_id' => $request->header('session-id'),
                'created_by' => $request->user()->id,
            ];

            $receipt = FeeReceipt::create($receiptData);

            foreach ($detailEntries as $entry) {
                $receipt->details()->create($entry);
            }
        });

        if (!$receipt) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create receipt.',
            ], 500);
        }

        $receipt->load(['details.feeHead', 'student', 'eduClass', 'section']);

        $payslip = [
            'receipt_no' => $receipt->receipt_no,
            'date' => $receipt->receipt_date,
            'student_name' => $student->name,
            'class' => $receipt->eduClass?->name ?? null,
            'section' => $receipt->section?->name ?? null,
            'payment_mode' => $receipt->payment_mode,
            'items' => $receipt->details->map(function ($d) {
                return [
                    'fee_head' => $d->feeHead?->name ?? null,
                    'amount' => $d->amount,
                    'concession' => $d->concession_amount,
                    'paid' => $d->paid_amount,
                ];
            }),
            'fine_applied' => (float) $receipt->fine_amount,
            'extra_concession' => (float) $receipt->concession_amount,
            'total_paid' => (float) $receipt->paid_amount,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Payment received successfully.',
            'receipt' => [
                'receipt_id' => $receipt->id,
                'receipt_no' => $receipt->receipt_no,
                'receipt_date' => $receipt->receipt_date,
                'paid_amount' => (float) $receipt->paid_amount,
                'payment_mode' => $receipt->payment_mode,
            ],
            'payslip' => $payslip,
        ], 201);
    }
}
