<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffDocumentType extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'short_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
