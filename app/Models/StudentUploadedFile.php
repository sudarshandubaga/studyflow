<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentUploadedFile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'school_id',
        'branch_id',
        'student_id',
        'student_document_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function documentType()
    {
        return $this->belongsTo(StudentDocument::class, 'student_document_id');
    }
}
