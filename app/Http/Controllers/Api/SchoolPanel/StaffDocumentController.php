<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StaffDocument;
use App\Models\StaffDocumentType;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StaffDocumentController extends Controller
{
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|max:5120', // Max 5MB per file
        ]);

        $results = [
            'success' => [],
            'errors' => []
        ];

        $school_id = $request->user()->school_id;
        $branch_id = $request->header('branch-id');

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);

            // Expected format: [DocShortName]_[AttendanceCode]
            $parts = explode('_', $nameWithoutExt);

            if (count($parts) < 2) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => 'Invalid file naming format. Expected [ShortName]_[AttendanceCode]'
                ];
                continue;
            }

            $docShortName = $parts[0];
            $attendanceCode = $parts[1];

            // 1. Find Document Type
            $docType = StaffDocumentType::where('short_name', $docShortName)
                ->where(function ($q) use ($branch_id) {
                    $q->where('branch_id', $branch_id)->orWhereNull('branch_id');
                })
                ->first();

            if (!$docType) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => "Document type with short name '{$docShortName}' not found."
                ];
                continue;
            }

            // 2. Find Employee
            $employee = Employee::where('attendance_code', $attendanceCode)
                ->first();

            if (!$employee) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => "Employee with attendance code '{$attendanceCode}' not found."
                ];
                continue;
            }

            // 3. Store File
            try {
                $path = $file->store('staff-documents', 'public');

                $document = StaffDocument::create([
                    'school_id' => $school_id,
                    'branch_id' => $branch_id,
                    'user_id' => $employee->user_id,
                    'staff_document_type_id' => $docType->id,
                    'file_name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                ]);

                $results['success'][] = [
                    'file' => $originalName,
                    'employee' => $employee->user->name,
                    'document_type' => $docType->name
                ];
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => 'Failed to store file: ' . $e->getMessage()
                ];
            }
        }

        return response()->json($results);
    }

    public function index(Request $request)
    {
        $query = StaffDocument::with(['user', 'documentType'])
            ->where('school_id', $request->user()->school_id);

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }

        if ($userId = $request->user_id) {
            $query->where('user_id', $userId);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function destroy(StaffDocument $staffDocument)
    {
        Storage::disk('public')->delete($staffDocument->file_path);
        $staffDocument->delete();
        return response()->json(['message' => 'Document deleted successfully']);
    }
}
