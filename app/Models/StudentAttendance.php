<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'attendance_legend_id',
        'date',
        'remarks',
        'school_id',
        'branch_id',
        'session_id',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function legend()
    {
        return $this->belongsTo(AttendanceLegend::class, 'attendance_legend_id');
    }
}
