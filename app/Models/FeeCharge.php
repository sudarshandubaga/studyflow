<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeCharge extends Model
{
    protected $guarded = ['id'];

    public function billScheme()
    {
        return $this->belongsTo(BillScheme::class);
    }

    public function eduClass()
    {
        return $this->belongsTo(EduClass::class, 'class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function concession()
    {
        return $this->belongsTo(FeeConcession::class, 'concession_id');
    }

    public function details()
    {
        return $this->hasMany(FeeChargeDetail::class);
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
}
