<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = [
        'name',
        'code',
        'is_active',
        'school_branch_id',
    ];

    public function schoolBranch()
    {
        return $this->belongsTo(SchoolBranch::class, 'school_branch_id');
    }
}
