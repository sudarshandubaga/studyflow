<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentLeave extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'attendance_legend_id',
        'from_date',
        'upto_date',
        'is_half_day',
        'reason',
        'status',
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
