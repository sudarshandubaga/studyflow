<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prospectus extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'school_branch_id',
        'session_id',
        'form_no',
        'class_id',
        'name',
        'father_name',
        'mobile_no',
        'total_amount',
        'payment_date',
        'reference_number',
        'payment_mode',
        'interaction_type',
        'meeting_id',
        'test_date',
        'test_time',
        'status',
    ];

    public function class()
    {
        return $this->belongsTo(EduClass::class, 'class_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function schoolBranch()
    {
        return $this->belongsTo(SchoolBranch::class);
    }
}
