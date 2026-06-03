<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallingReason extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
