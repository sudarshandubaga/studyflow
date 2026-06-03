<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_active',
        'school_branch_id',
    ];

    public function schoolBranch()
    {
        return $this->belongsTo(SchoolBranch::class);
    }
}
