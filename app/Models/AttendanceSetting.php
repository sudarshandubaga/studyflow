<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $fillable = [
        'branch_id',
        'default_in_time',
        'default_out_time',
        'mark_attendance_on_weekend',
    ];

    protected $casts = [
        'mark_attendance_on_weekend' => 'boolean',
    ];
}
