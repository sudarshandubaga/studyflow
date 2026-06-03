<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\StudentUploadedFile;
use App\Models\StudentDocument;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StudentFileUploadController extends Controller
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
        $session_id = $request->header('session-id'); // We might need this to find the document type

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            
            // Expected format: [DocShortName]_[EnrollmentNo]
            $parts = explode('_', $nameWithoutExt);

            if (count($parts) < 2) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => 'Invalid file naming format. Expected [ShortName]_[EnrollmentNo]'
                ];
                continue;
            }

            $docShortName = $parts[0];
            $enrollmentNo = $parts[1];

            // 1. Find Document Type
            $docType = StudentDocument::where('short_name', $docShortName)
                ->where('session_id', $session_id)
                ->first();

            if (!$docType) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => "Document type with short name '{$docShortName}' not found in current session."
                ];
                continue;
            }

            // 2. Find Student
            $student = Student::where('enrollment_no', $enrollmentNo)
                ->where('school_id', $school_id)
                ->first();

            if (!$student) {
                $results['errors'][] = [
                    'file' => $originalName,
                    'error' => "Student with enrollment number '{$enrollmentNo}' not found."
                ];
                continue;
            }

            // 3. Store File
            try {
                $path = $file->store('student-documents', 'public');

                $document = StudentUploadedFile::create([
                    'school_id' => $school_id,
                    'branch_id' => $branch_id,
                    'student_id' => $student->id,
                    'student_document_id' => $docType->id,
                    'file_name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                ]);

                $results['success'][] = [
                    'file' => $originalName,
                    'student' => $student->first_name . ' ' . $student->last_name,
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
        $query = StudentUploadedFile::with(['student', 'documentType'])
            ->where('school_id', $request->user()->school_id);

        if ($branchId = $request->header('branch-id')) {
            $query->where('branch_id', $branchId);
        }

        if ($studentId = $request->student_id) {
            $query->where('student_id', $studentId);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function destroy($id)
    {
        $file = StudentUploadedFile::findOrFail($id);
        Storage::disk('public')->delete($file->file_path);
        $file->delete();
        return response()->json(['message' => 'Document deleted successfully']);
    }
}
