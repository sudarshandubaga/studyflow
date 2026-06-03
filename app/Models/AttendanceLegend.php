<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLegend extends Model
{
    protected $fillable = [
        'name',
        'short_name',
        'type',
        'treat_as',
        'color',
        'is_active',
        'branch_id',
        'session_id',
    ];

    protected $casts = [
        'total_leaves' => 'integer',
        'is_active' => 'boolean',
    ];
}
