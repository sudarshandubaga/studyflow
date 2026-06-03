<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\SchoolPanel\SessionController;
use App\Http\Controllers\Api\SchoolPanel\EduClassController;
use App\Http\Controllers\Api\SchoolPanel\SectionController;
use App\Http\Controllers\Api\SchoolPanel\SubjectController;
use App\Http\Controllers\Api\SchoolPanel\StudentController;
use App\Http\Controllers\Api\SchoolPanel\FeeController;
use App\Http\Controllers\Api\SchoolPanel\ProspectusController;
use App\Http\Controllers\Api\SchoolPanel\SectionGroupController;
use App\Http\Controllers\Api\SchoolPanel\StudentCategoryController;
use App\Http\Controllers\Api\SchoolPanel\StudentDocumentController;
use App\Http\Controllers\Api\SchoolPanel\StudentFileUploadController;
use App\Http\Controllers\Api\SchoolPanel\AttendanceLegendController;
use App\Http\Controllers\Api\SchoolPanel\TitleController;

use App\Http\Controllers\Api\SchoolPanel\AuthController;
use App\Http\Controllers\Api\SchoolPanel\SchoolController;
use App\Http\Controllers\Api\SchoolPanel\SchoolBranchController;
use App\Http\Controllers\Api\SchoolPanel\UserController;
use App\Http\Controllers\Api\SchoolPanel\RoleController;
use App\Http\Controllers\Api\SchoolPanel\CountryController;
use App\Http\Controllers\Api\SchoolPanel\StateController;
use App\Http\Controllers\Api\SchoolPanel\CityController;

use App\Http\Controllers\Api\SchoolPanel\StaffAttendanceController;
use App\Http\Controllers\Api\SchoolPanel\FeeHeadController;
use App\Http\Controllers\Api\SchoolPanel\BillSchemeController;
use App\Http\Controllers\Api\SchoolPanel\FeeConcessionController;
use App\Http\Controllers\Api\SchoolPanel\FeeFineController;
use App\Http\Controllers\Api\SchoolPanel\FeeBankController;
use App\Http\Controllers\Api\SchoolPanel\FeeChargeController;
use App\Http\Controllers\Api\SchoolPanel\FeeReceiptController;
use App\Http\Controllers\Api\SchoolPanel\FeeBillBookController;

Route::prefix('school-panel')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('change-password', [AuthController::class, 'changePassword']);

        // Staff Attendance
        Route::get('staff-attendance', [StaffAttendanceController::class, 'index']);
        Route::post('staff-attendance', [StaffAttendanceController::class, 'store']);
        Route::delete('staff-attendance', [StaffAttendanceController::class, 'destroy']);

        // Leave Applications
        Route::get('leave-applications/balances', [\App\Http\Controllers\Api\SchoolPanel\LeaveApplicationController::class, 'balances']);
        Route::patch('leave-applications/{leaveApplication}/status', [\App\Http\Controllers\Api\SchoolPanel\LeaveApplicationController::class, 'updateStatus']);
        Route::apiResource('leave-applications', \App\Http\Controllers\Api\SchoolPanel\LeaveApplicationController::class);

        // School Setup Routes
        Route::get('school', [SchoolController::class, 'show']);
        Route::put('school', [SchoolController::class, 'update']);
        Route::apiResource('school-branches', SchoolBranchController::class);
        Route::apiResource('countries', CountryController::class);
        Route::apiResource('states', StateController::class);
        Route::apiResource('cities', CityController::class);
        Route::post('student-titles/bulk', [TitleController::class, 'bulkAction'])->name('student-titles.bulk');
        Route::apiResource('student-titles', TitleController::class);
        Route::get('titles', [TitleController::class, 'index'])->name('titles.index');

        Route::post('event-calendars/bulk', [\App\Http\Controllers\Api\SchoolPanel\EventCalendarController::class, 'bulkAction']);
        Route::apiResource('event-calendars', \App\Http\Controllers\Api\SchoolPanel\EventCalendarController::class);

        Route::post('custom-field-categories/bulk', [\App\Http\Controllers\Api\SchoolPanel\CustomFieldCategoryController::class, 'bulkAction']);
        Route::apiResource('custom-field-categories', \App\Http\Controllers\Api\SchoolPanel\CustomFieldCategoryController::class);

        Route::post('custom-fields/bulk', [\App\Http\Controllers\Api\SchoolPanel\CustomFieldController::class, 'bulkAction']);
        Route::apiResource('custom-fields', \App\Http\Controllers\Api\SchoolPanel\CustomFieldController::class);

        Route::post('users/bulk-assign-role', [UserController::class, 'bulkAssignRole']);
        Route::post('users/bulk-update', [UserController::class, 'bulkUpdate']);
        Route::apiResource('users', UserController::class);
        Route::get('permissions', [RoleController::class, 'getPermissions']);
        Route::apiResource('roles', RoleController::class);

        Route::post('attendance-legends/bulk', [\App\Http\Controllers\Api\SchoolPanel\AttendanceLegendController::class, 'bulkAction']);
        Route::apiResource('attendance-legends', \App\Http\Controllers\Api\SchoolPanel\AttendanceLegendController::class);

        Route::get('attendance-settings', [\App\Http\Controllers\Api\SchoolPanel\AttendanceSettingController::class, 'index']);
        Route::put('attendance-settings', [\App\Http\Controllers\Api\SchoolPanel\AttendanceSettingController::class, 'update']);

        Route::post('calling-reasons/bulk', [\App\Http\Controllers\Api\SchoolPanel\CallingReasonController::class, 'bulkAction']);
        Route::apiResource('calling-reasons', \App\Http\Controllers\Api\SchoolPanel\CallingReasonController::class);

        Route::post('staff-document-types/bulk', [\App\Http\Controllers\Api\SchoolPanel\StaffDocumentTypeController::class, 'bulkAction']);
        Route::apiResource('staff-document-types', \App\Http\Controllers\Api\SchoolPanel\StaffDocumentTypeController::class);

        Route::post('staff-documents/bulk-upload', [\App\Http\Controllers\Api\SchoolPanel\StaffDocumentController::class, 'bulkUpload']);
        Route::apiResource('staff-documents', \App\Http\Controllers\Api\SchoolPanel\StaffDocumentController::class);

        Route::apiResource('sessions', SessionController::class);
        Route::post('classes/reorder', [EduClassController::class, 'reorder']);
        Route::post('classes/bulk', [EduClassController::class, 'bulkStore']);
        Route::apiResource('classes', EduClassController::class);
        Route::post('sections/bulk', [SectionController::class, 'bulkStore']);
        Route::apiResource('sections', SectionController::class);
        Route::post('subjects/bulk', [SubjectController::class, 'bulkAction']);
        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('students', StudentController::class);

        // Fee Module - Masters
        Route::post('fee-heads/bulk', [FeeHeadController::class, 'bulkAction']);
        Route::apiResource('fee-heads', FeeHeadController::class);

        Route::post('bill-schemes/bulk', [BillSchemeController::class, 'bulkAction']);
        Route::apiResource('bill-schemes', BillSchemeController::class);

        Route::post('fee-concessions/bulk', [FeeConcessionController::class, 'bulkAction']);
        Route::apiResource('fee-concessions', FeeConcessionController::class);

        Route::post('fee-fines/bulk', [FeeFineController::class, 'bulkAction']);
        Route::apiResource('fee-fines', FeeFineController::class);

        Route::post('fee-banks/bulk', [FeeBankController::class, 'bulkAction']);
        Route::apiResource('fee-banks', FeeBankController::class);

        // Fee Module - Operations
        Route::get('fee-charges/report', [FeeChargeController::class, 'report']);
        Route::apiResource('fee-charges', FeeChargeController::class);

        Route::get('fee-receipts/due-report', [FeeReceiptController::class, 'dueReport']);
        Route::get('fee-receipts/cancelled-report', [FeeReceiptController::class, 'cancelledReport']);
        Route::get('fee-receipts/headwise-report', [FeeReceiptController::class, 'headwiseReport']);
        Route::post('fee-receipts/{feeReceipt}/cancel', [FeeReceiptController::class, 'cancel']);
        Route::apiResource('fee-receipts', FeeReceiptController::class)->except(['update', 'destroy']);
        // Fee Receipt Wizard (Flow-based API)
        Route::get('fee-receipt-wizard/types', [\App\Http\Controllers\Api\SchoolPanel\FeeReceiptWizardController::class, 'types']);
        Route::get('fee-receipt-wizard/search-students', [\App\Http\Controllers\Api\SchoolPanel\FeeReceiptWizardController::class, 'searchStudents']);
        Route::get('fee-receipt-wizard/classes', [\App\Http\Controllers\Api\SchoolPanel\FeeReceiptWizardController::class, 'classes']);
        Route::get('fee-receipt-wizard/student-due-details/{student_id}', [\App\Http\Controllers\Api\SchoolPanel\FeeReceiptWizardController::class, 'studentDueDetails']);
        Route::post('fee-receipt-wizard/receive-payment', [\App\Http\Controllers\Api\SchoolPanel\FeeReceiptWizardController::class, 'receivePayment']);

        // Fee Bill (Bulk Payslip)
        Route::get('fee-bill/filters', [\App\Http\Controllers\Api\SchoolPanel\FeeBillController::class, 'filters']);
        Route::post('fee-bill/students', [\App\Http\Controllers\Api\SchoolPanel\FeeBillController::class, 'students']);
        Route::post('fee-bill/payslip-pdf', [\App\Http\Controllers\Api\SchoolPanel\FeeBillController::class, 'payslipPdf']);

        Route::post('fee-bill-books/bulk', [FeeBillBookController::class, 'bulkAction']);
        Route::apiResource('fee-bill-books', FeeBillBookController::class);

        // Admission Routes
        Route::get('prospectus/find-by-form', [ProspectusController::class, 'findByFormNo']);
        Route::get('prospectus/next-form-no', [ProspectusController::class, 'nextFormNo']);
        Route::apiResource('prospectus', ProspectusController::class);

        // Group Routes
        Route::post('groups/bulk', [SectionGroupController::class, 'bulkStore']);
        Route::apiResource('groups', SectionGroupController::class);

        // SIS Student Routes
        Route::get('academic-structure', [\App\Http\Controllers\Api\SchoolPanel\StudentController::class, 'getAcademicStructure']);

        // Student Attendance
        Route::get('attendance-batch', [\App\Http\Controllers\Api\SchoolPanel\StudentAttendanceController::class, 'getAttendanceBatch']);
        Route::post('attendance-bulk', [\App\Http\Controllers\Api\SchoolPanel\StudentAttendanceController::class, 'bulkStore']);
        Route::delete('attendance-bulk', [\App\Http\Controllers\Api\SchoolPanel\StudentAttendanceController::class, 'bulkDelete']);

        // Student Leave Application
        Route::get('student-legends', [\App\Http\Controllers\Api\SchoolPanel\StudentLeaveController::class, 'getStudentLegends']);
        Route::apiResource('student-leaves', \App\Http\Controllers\Api\SchoolPanel\StudentLeaveController::class);

        // SIS Master Routes
        Route::post('students/bulk-update', [StudentController::class, 'bulkUpdate']);
        Route::post('students/bulk-delete', [StudentController::class, 'bulkDelete']);
        Route::post('students/promote', [StudentController::class, 'promote']);
        Route::post('students/bulk-status-update', [StudentController::class, 'bulkStatusUpdate']);

        Route::get('student-uploaded-files', [StudentFileUploadController::class, 'index']);
        Route::post('student-uploaded-files/bulk-upload', [StudentFileUploadController::class, 'bulkUpload']);
        Route::delete('student-uploaded-files/{id}', [StudentFileUploadController::class, 'destroy']);

        Route::apiResource('student-categories', StudentCategoryController::class);
        Route::apiResource('student-documents', StudentDocumentController::class);
    });
});
