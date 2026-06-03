<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveApplication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'school_id',
        'branch_id',
        'session_id',
        'user_id',
        'attendance_legend_id',
        'from_date',
        'to_date',
        'is_half_day',
        'reason',
        'status',
        'approved_by',
        'remarks',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'is_half_day' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendanceLegend()
    {
        return $this->belongsTo(AttendanceLegend::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
