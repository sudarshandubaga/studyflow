<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeReceipt extends Model
{
    protected $guarded = ['id'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function eduClass()
    {
        return $this->belongsTo(EduClass::class, 'class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function details()
    {
        return $this->hasMany(FeeReceiptDetail::class);
    }

    public function feeBank()
    {
        return $this->belongsTo(FeeBank::class);
    }

    public function branch()
    {
        return $this->belongsTo(SchoolBranch::class, 'branch_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
