<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'attendance_date',
        'attendance_legend_id',
        'is_half_day',
        'time_slots',
        'school_id',
        'branch_id',
    ];

    protected $casts = [
        'is_half_day' => 'boolean',
        'time_slots' => 'array',
        'attendance_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function legend()
    {
        return $this->belongsTo(AttendanceLegend::class, 'attendance_legend_id');
    }
}
