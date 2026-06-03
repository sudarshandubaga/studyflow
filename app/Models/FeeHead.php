<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeHead extends Model
{
    protected $fillable = [
        'name', 'short_name', 'is_admission_fee', 'is_refundable', 
        'is_once_a_year', 'is_once_a_career', 'student_category_id', 
        'school_id', 'branch_id', 'session_id', 'is_active'
    ];

    public function category() { return $this->belongsTo(StudentCategory::class, 'student_category_id'); }
    public function branch() { return $this->belongsTo(SchoolBranch::class, 'branch_id'); }
    public function session() { return $this->belongsTo(Session::class, 'session_id'); }
    public function school() { return $this->belongsTo(School::class, 'school_id'); }
}
