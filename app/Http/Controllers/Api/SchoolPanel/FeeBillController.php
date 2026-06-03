<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Section;
use App\Models\EduClass;
use App\Models\BillScheme;
use App\Models\BillSchemeStudent;
use App\Models\BillSchemeSection;
use App\Models\FeeReceipt;
use App\Models\FeeReceiptDetail;
use App\Models\FeeHead;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class FeeBillController extends Controller
{
    /**
     * Get filter options: sections, bill schemes, slabs
     * GET /api/school-panel/fee-bill/filters
     */
    public function filters()
    {
        $branchId = request()->header('branch-id');
        $sessionId = request()->header('session-id');

        $classes = EduClass::with('sections')->get()->map(function ($class) {
            return [
                'id' => $class->id,
                'name' => $class->name,
                'sections' => $class->sections->map(function ($s) {
                    return ['id' => $s->id, 'name' => $s->name];
                }),
            ];
        });

        $schemes = BillScheme::where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->get(['id', 'name', 'date', 'slab']);

        $slabs = $schemes->pluck('slab')->filter()->unique()->values();

        $feeHeads = FeeHead::where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->get(['id', 'name', 'short_name', 'is_imprest']);

        return response()->json([
            'classes' => $classes,
            'bill_schemes' => $schemes,
            'slabs' => $slabs,
            'fee_heads' => $feeHeads,
        ]);
    }

    /**
     * Get filtered students for fee bill
     * GET /api/school-panel/fee-bill/students
     */
    public function students(Request $request)
    {
        $validated = $request->validate([
            'section_ids' => 'nullable|array',
            'section_ids.*' => 'exists:sections,id',
            'bill_scheme_ids' => 'nullable|array',
            'bill_scheme_ids.*' => 'exists:bill_schemes,id',
            'slabs' => 'nullable|array',
            'slabs.*' => 'string',
            'include_imprest' => 'nullable|boolean',
        ]);

        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id');

        $sectionIds = $validated['section_ids'] ?? [];
        $schemeIds = $validated['bill_scheme_ids'] ?? [];
        $slabs = $validated['slabs'] ?? [];
        $includeImprest = $validated['include_imprest'] ?? true;

        // If slabs provided, find matching schemes
        if (!empty($slabs)) {
            $schemeIdsBySlab = BillScheme::where('is_active', true)
                ->whereIn('slab', $slabs)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
                ->pluck('id')
                ->toArray();
            $schemeIds = array_unique(array_merge($schemeIds, $schemeIdsBySlab));
        }

        // Determine applicable student IDs from bill schemes
        $studentIdsFromSchemes = collect();
        if (!empty($schemeIds)) {
            $directStudents = BillSchemeStudent::whereIn('bill_scheme_id', $schemeIds)
                ->pluck('student_id');
            $studentIdsFromSchemes = $studentIdsFromSchemes->merge($directStudents);

            $sectionIdsFromSchemes = BillSchemeSection::whereIn('bill_scheme_id', $schemeIds)
                ->pluck('section_id');
            if ($sectionIdsFromSchemes->isNotEmpty()) {
                $sectionStudents = Student::whereIn('section_id', $sectionIdsFromSchemes)
                    ->where('is_active', true)
                    ->pluck('id');
                $studentIdsFromSchemes = $studentIdsFromSchemes->merge($sectionStudents);
            }
        }

        // Fetch students matching filters
        $query = Student::with(['section.eduClass'])
            ->where('is_active', true);

        if (!empty($sectionIds)) {
            $query->whereIn('section_id', $sectionIds);
        }

        if (!empty($schemeIds) && $studentIdsFromSchemes->isNotEmpty()) {
            $query->whereIn('id', $studentIdsFromSchemes->unique());
        }

        if (!empty($schemeIds) && empty($sectionIds)) {
            $query->whereIn('id', $studentIdsFromSchemes->unique());
        }

        $students = $query->get();

        // Get all fee heads for amount computation
        $allFeeHeads = FeeHead::where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->get();

        $imprestHeadIds = $allFeeHeads->where('is_imprest', true)->pluck('id')->toArray();

        // Compute due/payable amounts for each student
        $result = $students->map(function ($student) use ($schemeIds, $slabs, $includeImprest, $imprestHeadIds, $branchId, $sessionId) {
            // Get bill schemes for this student
            $schemes = $this->getStudentSchemes($student->id, $student->section_id, $schemeIds, $slabs, $branchId, $sessionId);

            // Get fee head amounts from schemes
            $totalAmount = 0;
            $headDetails = [];
            $processedHeads = [];

            foreach ($schemes as $scheme) {
                foreach ($scheme->details as $detail) {
                    $headId = $detail->fee_head_id;

                    if (in_array($headId, $processedHeads)) continue;

                    // Skip imprest heads if not included
                    if (!$includeImprest && in_array($headId, $imprestHeadIds)) {
                        $processedHeads[] = $headId;
                        continue;
                    }

                    $totalAmount += (float) $detail->amount;
                    $headDetails[] = [
                        'fee_head_name' => $detail->feeHead?->name ?? 'Unknown',
                        'amount' => (float) $detail->amount,
                    ];
                    $processedHeads[] = $headId;
                }
            }

            // Get already paid
            $alreadyPaid = 0;
            if (!empty($processedHeads)) {
                $paidData = FeeReceiptDetail::whereHas('feeReceipt', function ($q) use ($student) {
                    $q->where('student_id', $student->id)->where('status', 'Paid');
                })
                    ->whereIn('fee_head_id', $processedHeads)
                    ->selectRaw('SUM(paid_amount) as total_paid')
                    ->first();
                $alreadyPaid = (float) ($paidData?->total_paid ?? 0);
            }

            $dueAmount = max(0, $totalAmount - $alreadyPaid);
            $schemeNames = $schemes->pluck('name')->unique()->values();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'enrollment_no' => $student->enrollment_no,
                'roll_no' => $student->roll_no,
                'class' => $student->section?->eduClass?->name ?? 'N/A',
                'section' => $student->section?->name ?? 'N/A',
                'section_id' => $student->section_id,
                'schemes' => $schemeNames,
                'total_amount' => $totalAmount,
                'already_paid' => $alreadyPaid,
                'due_amount' => $dueAmount,
                'head_details' => $headDetails,
            ];
        });

        return response()->json([
            'students' => $result,
            'summary' => [
                'total_students' => $result->count(),
                'total_amount' => $result->sum('total_amount'),
                'total_paid' => $result->sum('already_paid'),
                'total_due' => $result->sum('due_amount'),
            ],
        ]);
    }

    /**
     * Generate bulk payslip PDF for selected students
     * POST /api/school-panel/fee-bill/payslip-pdf
     */
    public function payslipPdf(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'receipt_date' => 'required|date',
            'payment_mode' => 'required|string',
        ]);

        $students = Student::with(['section.eduClass'])
            ->whereIn('id', $validated['student_ids'])
            ->get();

        $branchId = $request->header('branch-id');
        $sessionId = $request->header('session-id');

        // Get latest receipts for these students
        $receipts = FeeReceipt::whereIn('student_id', $validated['student_ids'])
            ->where('status', 'Paid')
            ->whereDate('receipt_date', $validated['receipt_date'])
            ->with(['details.feeHead', 'student.section.eduClass'])
            ->get()
            ->groupBy('student_id');

        $payslipData = [];
        foreach ($students as $student) {
            $studentReceipts = $receipts->get($student->id, collect());
            $latestReceipt = $studentReceipts->sortByDesc('id')->first();
            $totalPaid = $studentReceipts->sum('paid_amount');

            $schemes = $this->getStudentSchemes($student->id, $student->section_id, [], [], $branchId, $sessionId);
            $headDetails = [];
            $processedHeads = [];
            foreach ($schemes as $scheme) {
                foreach ($scheme->details as $detail) {
                    if (!in_array($detail->fee_head_id, $processedHeads)) {
                        $headDetails[] = [
                            'fee_head_name' => $detail->feeHead?->name ?? 'Unknown',
                            'amount' => (float) $detail->amount,
                        ];
                        $processedHeads[] = $detail->fee_head_id;
                    }
                }
            }

            $payslipData[] = [
                'student_name' => $student->name,
                'enrollment_no' => $student->enrollment_no,
                'roll_no' => $student->roll_no,
                'class' => $student->section?->eduClass?->name ?? 'N/A',
                'section' => $student->section?->name ?? 'N/A',
                'receipt_no' => $latestReceipt?->receipt_no ?? '—',
                'receipt_date' => $validated['receipt_date'],
                'payment_mode' => $validated['payment_mode'],
                'head_details' => $headDetails,
                'total_amount' => collect($headDetails)->sum('amount'),
                'paid_amount' => $totalPaid,
                'fine_amount' => $latestReceipt?->fine_amount ?? 0,
                'concession_amount' => $latestReceipt?->concession_amount ?? 0,
            ];
        }

        // Generate PDF - 3 columns x 2 rows = 6 slips per page
        $pdf = Pdf::loadView('pdf.bulk-payslip', [
            'payslips' => $payslipData,
            'columns' => 3,
            'rows' => 2,
        ]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('payslips-' . now()->format('Ymd-His') . '.pdf');
    }

    private function getStudentSchemes($studentId, $sectionId, $filterSchemeIds = [], $filterSlabs = [], $branchId = null, $sessionId = null)
    {
        $schemeIds = collect();

        $directSchemes = BillSchemeStudent::where('student_id', $studentId)->pluck('bill_scheme_id');
        $schemeIds = $schemeIds->merge($directSchemes);

        if ($sectionId) {
            $sectionSchemes = BillSchemeSection::where('section_id', $sectionId)->pluck('bill_scheme_id');
            $schemeIds = $schemeIds->merge($sectionSchemes);
        }

        $schemeIds = $schemeIds->unique();

        // Apply scheme filter if provided
        if (!empty($filterSchemeIds)) {
            $schemeIds = $schemeIds->intersect($filterSchemeIds);
        }

        $query = BillScheme::whereIn('id', $schemeIds)
            ->where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
            ->with('details.feeHead');

        // Apply slab filter if provided
        if (!empty($filterSlabs)) {
            $query->whereIn('slab', $filterSlabs);
        }

        return $query->get();
    }
}
